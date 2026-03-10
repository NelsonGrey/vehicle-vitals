interface PremiumVerificationInput {
  productId: string;
  source: string;
  receipt: string;
}

export interface PremiumVerificationResult {
  verified: boolean;
  verificationState: 'verified' | 'provisional' | 'unverified';
  provider: string;
  reason?: string;
}

function boolFromEnv(name: string, defaultValue: boolean): boolean {
  const raw = (process.env[name] || '').trim().toLowerCase();
  if (!raw) return defaultValue;
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

function normalizePurchaseSource(source: string): string {
  const normalized = (source || '').trim().toLowerCase();

  if (
    normalized === 'play_store' ||
    normalized === 'google_play' ||
    normalized === 'playstore'
  ) {
    return 'play_store';
  }

  if (
    normalized === 'app_store' ||
    normalized === 'apple_app_store' ||
    normalized === 'appstore'
  ) {
    return 'app_store';
  }

  return normalized || 'unknown';
}

function normalizePrivateKey(value: string): string {
  return value.replace(/\\n/g, '\n');
}

function toBase64Url(input: Buffer | string): string {
  const value = Buffer.isBuffer(input)
    ? input.toString('base64')
    : Buffer.from(input).toString('base64');
  return value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function getGooglePlayAccessToken(): Promise<string> {
  const explicitToken = (process.env.GOOGLE_PLAY_ACCESS_TOKEN || '').trim();
  if (explicitToken) {
    return explicitToken;
  }

  const clientEmail = (
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL || ''
  ).trim();
  const rawPrivateKey = (
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY || ''
  ).trim();

  if (!clientEmail || !rawPrivateKey) {
    throw new Error(
      'GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL or GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY not configured'
    );
  }

  const privateKey = normalizePrivateKey(rawPrivateKey);
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const unsignedToken = `${toBase64Url(JSON.stringify(header))}.${toBase64Url(JSON.stringify(claims))}`;

  const crypto = await import('crypto');
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedToken);
  signer.end();
  const signature = signer.sign(privateKey);
  const assertion = `${unsignedToken}.${toBase64Url(signature)}`;

  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google OAuth token HTTP ${response.status}: ${text}`);
  }

  const payload = (await response.json()) as { access_token?: string };
  const accessToken = (payload.access_token || '').toString();
  if (!accessToken) {
    throw new Error('Google OAuth token response missing access_token');
  }

  return accessToken;
}

async function verifyPlayStoreReceipt(
  input: PremiumVerificationInput
): Promise<PremiumVerificationResult> {
  const packageName = (process.env.GOOGLE_PLAY_PACKAGE_NAME || '').trim();
  if (!packageName) {
    return {
      verified: false,
      verificationState: 'provisional',
      provider: 'play_store',
      reason: 'GOOGLE_PLAY_PACKAGE_NAME not configured',
    };
  }

  let accessToken: string;
  try {
    accessToken = await getGooglePlayAccessToken();
  } catch (error) {
    return {
      verified: false,
      verificationState: 'unverified',
      provider: 'play_store',
      reason: `Google OAuth token fetch failed: ${String(error)}`,
    };
  }

  const purchaseToken = input.receipt;
  const endpoint =
    'https://androidpublisher.googleapis.com/androidpublisher/v3/applications/' +
    `${encodeURIComponent(packageName)}/purchases/products/${encodeURIComponent(input.productId)}` +
    `/tokens/${encodeURIComponent(purchaseToken)}`;

  let payload: any;
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        verified: false,
        verificationState: 'unverified',
        provider: 'play_store',
        reason: `Play purchase lookup HTTP ${response.status}: ${text}`,
      };
    }

    payload = await response.json();
  } catch (error) {
    return {
      verified: false,
      verificationState: 'unverified',
      provider: 'play_store',
      reason: `Play purchase lookup failed: ${String(error)}`,
    };
  }

  const purchaseState = Number(payload?.purchaseState);
  const consumptionState = Number(payload?.consumptionState);

  const verified = purchaseState === 0 && consumptionState === 0;
  return {
    verified,
    verificationState: verified ? 'verified' : 'unverified',
    provider: 'play_store',
    reason: verified
      ? undefined
      : `Play purchase state invalid (purchaseState=${purchaseState}, consumptionState=${consumptionState})`,
  };
}

async function postAppleVerifyReceipt(
  url: string,
  receipt: string,
  sharedSecret: string
): Promise<any> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      'receipt-data': receipt,
      password: sharedSecret,
      'exclude-old-transactions': true,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Apple verifyReceipt HTTP ${response.status}: ${text}`);
  }

  return response.json();
}

async function verifyAppleReceipt(
  input: PremiumVerificationInput
): Promise<PremiumVerificationResult> {
  const sharedSecret = (process.env.APPLE_SHARED_SECRET || '').trim();
  if (!sharedSecret) {
    return {
      verified: false,
      verificationState: 'provisional',
      provider: 'app_store',
      reason: 'APPLE_SHARED_SECRET not configured',
    };
  }

  const productionUrl = 'https://buy.itunes.apple.com/verifyReceipt';
  const sandboxUrl = 'https://sandbox.itunes.apple.com/verifyReceipt';

  let payload: any;
  try {
    const firstAttempt = await postAppleVerifyReceipt(
      productionUrl,
      input.receipt,
      sharedSecret
    );
    payload =
      firstAttempt?.status === 21007
        ? await postAppleVerifyReceipt(sandboxUrl, input.receipt, sharedSecret)
        : firstAttempt;
  } catch (error) {
    return {
      verified: false,
      verificationState: 'unverified',
      provider: 'app_store',
      reason: `Apple verifyReceipt request failed: ${String(error)}`,
    };
  }

  if (payload?.status !== 0) {
    return {
      verified: false,
      verificationState: 'unverified',
      provider: 'app_store',
      reason: `Apple verifyReceipt status=${payload?.status ?? 'unknown'}`,
    };
  }

  const receiptItems = [
    ...(Array.isArray(payload?.receipt?.in_app) ? payload.receipt.in_app : []),
    ...(Array.isArray(payload?.latest_receipt_info)
      ? payload.latest_receipt_info
      : []),
  ];

  const productMatched = receiptItems.some(
    (item: { product_id?: string }) => item.product_id === input.productId
  );

  return {
    verified: productMatched,
    verificationState: productMatched ? 'verified' : 'unverified',
    provider: 'app_store',
    reason: productMatched
      ? undefined
      : 'Receipt valid but product not found in transaction history',
  };
}

export async function verifyPremiumReceipt(
  input: PremiumVerificationInput
): Promise<PremiumVerificationResult> {
  const source = normalizePurchaseSource(input.source);
  const strictUnknownSource = boolFromEnv(
    'PREMIUM_UNKNOWN_SOURCE_UNVERIFIED',
    true
  );

  if (source === 'app_store') {
    return verifyAppleReceipt({ ...input, source });
  }

  if (source === 'play_store') {
    return verifyPlayStoreReceipt({ ...input, source });
  }

  return {
    verified: false,
    verificationState: strictUnknownSource ? 'unverified' : 'provisional',
    provider: source,
    reason: 'Unknown purchase source',
  };
}
