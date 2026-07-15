import {verifyPremiumReceipt} from "./premium.provider";

export interface BillingPurchaseVerificationInput {
  productId: string;
  source: string;
  receipt: string;
}

export interface BillingVerificationResult {
  verified: boolean;
  verificationState: string;
  provider: string;
  reason?: string;
}

export interface StripeCheckoutSessionInput {
  uid: string;
  tier: "pro" | "premium";
  billingPeriod: "monthly" | "annual";
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}

export interface StripeCheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string;
  customerId: string;
  subscriptionId: string;
}

function getStripePriceId(
  tier: "pro" | "premium",
  billingPeriod: "monthly" | "annual"
): string {
  let envName = "STRIPE_PRICE_ID_PREMIUM_MONTHLY";
  if (tier === "pro" && billingPeriod === "annual") {
    envName = "STRIPE_PRICE_ID_PRO_ANNUAL";
  } else if (tier === "pro") {
    envName = "STRIPE_PRICE_ID_PRO_MONTHLY";
  } else if (billingPeriod === "annual") {
    envName = "STRIPE_PRICE_ID_PREMIUM_ANNUAL";
  }

  return (process.env[envName] || "").toString().trim();
}

function requireStripeSecretKey(): string {
  const key = (process.env.STRIPE_SECRET_KEY || "").toString().trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }

  return key;
}

export async function createStripeCheckoutSession(
  input: StripeCheckoutSessionInput
): Promise<StripeCheckoutSessionResult> {
  const secretKey = requireStripeSecretKey();
  const priceId = getStripePriceId(input.tier, input.billingPeriod);

  if (!priceId) {
    throw new Error(
      `Stripe price id missing for ${input.tier}:${input.billingPeriod}`
    );
  }

  const form = new URLSearchParams();
  form.set("mode", "subscription");
  form.set("line_items[0][price]", priceId);
  form.set("line_items[0][quantity]", "1");
  form.set("success_url", input.successUrl);
  form.set("cancel_url", input.cancelUrl);
  form.set("client_reference_id", input.uid);
  form.set("metadata[uid]", input.uid);
  form.set("metadata[targetTier]", input.tier);
  form.set("metadata[billingPeriod]", input.billingPeriod);
  form.set("subscription_data[metadata][uid]", input.uid);
  form.set("subscription_data[metadata][targetTier]", input.tier);
  form.set("subscription_data[metadata][billingPeriod]", input.billingPeriod);

  const trimmedCustomerEmail = (input.customerEmail || "").trim();
  if (trimmedCustomerEmail) {
    form.set("customer_email", trimmedCustomerEmail);
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = (
      payload?.error?.message || "Stripe checkout session creation failed"
    ).toString();
    throw new Error(`Stripe checkout error (${response.status}): ${message}`);
  }

  const sessionId = (payload?.id || "").toString();
  const checkoutUrl = (payload?.url || "").toString();

  if (!sessionId || !checkoutUrl) {
    throw new Error("Stripe checkout response missing id or url");
  }

  return {
    sessionId,
    checkoutUrl,
    customerId: (payload?.customer || "").toString(),
    subscriptionId: (payload?.subscription || "").toString(),
  };
}

export interface StripeTierPrice {
  amount: number;
  currency: string;
  interval: "month" | "year";
}

export interface StripeSubscriptionPricing {
  pro: { monthly: StripeTierPrice | null; annual: StripeTierPrice | null };
  premium: { monthly: StripeTierPrice | null; annual: StripeTierPrice | null };
}

async function fetchStripePrice(
  secretKey: string,
  priceId: string
): Promise<StripeTierPrice | null> {
  if (!priceId) {
    return null;
  }

  const response = await fetch(
    `https://api.stripe.com/v1/prices/${encodeURIComponent(priceId)}`,
    {
      headers: {Authorization: `Bearer ${secretKey}`},
    }
  );

  if (!response.ok) {
    return null;
  }

  const payload = await response.json().catch(() => null);
  const unitAmount = payload?.unit_amount;
  const interval = payload?.recurring?.interval;
  if (
    typeof unitAmount !== "number" ||
    (interval !== "month" && interval !== "year")
  ) {
    return null;
  }

  return {
    amount: unitAmount / 100,
    currency: (payload?.currency || "usd").toString(),
    interval,
  };
}

export async function getStripeSubscriptionPricing(): Promise<StripeSubscriptionPricing> {
  const secretKey = requireStripeSecretKey();

  const [proMonthly, proAnnual, premiumMonthly, premiumAnnual] =
    await Promise.all([
      fetchStripePrice(secretKey, getStripePriceId("pro", "monthly")),
      fetchStripePrice(secretKey, getStripePriceId("pro", "annual")),
      fetchStripePrice(secretKey, getStripePriceId("premium", "monthly")),
      fetchStripePrice(secretKey, getStripePriceId("premium", "annual")),
    ]);

  return {
    pro: {monthly: proMonthly, annual: proAnnual},
    premium: {monthly: premiumMonthly, annual: premiumAnnual},
  };
}

export interface IapProductSpec {
  tier: "pro" | "premium";
  billingPeriod: "monthly" | "annual";
}

// Apple requires the developer to choose these product-id strings when
// creating each subscription in App Store Connect (unlike Stripe, which
// generates its own price ids) — these must match ASC exactly.
export const IAP_PRODUCT_CATALOG: Record<string, IapProductSpec> = {
  PRO_iOS_MONTH: {tier: "pro", billingPeriod: "monthly"},
  PRO_iOS_ANNUAL: {tier: "pro", billingPeriod: "annual"},
  PREMIUM_iOS_MONTH: {tier: "premium", billingPeriod: "monthly"},
  PREMIUM_iOS_ANNUAL: {tier: "premium", billingPeriod: "annual"},
};

export async function verifyBillingPurchase(
  input: BillingPurchaseVerificationInput
): Promise<BillingVerificationResult> {
  const normalizedSource = (input.source || "unknown").toString();

  // Current implementation delegates to premium receipt verification.
  // The abstraction allows future Stripe/enterprise invoice providers.
  if (IAP_PRODUCT_CATALOG[input.productId]) {
    const verification = await verifyPremiumReceipt({
      productId: input.productId,
      source: normalizedSource,
      receipt: input.receipt,
    });

    return {
      verified: verification.verified,
      verificationState: verification.verificationState,
      provider: verification.provider,
      reason: verification.reason,
    };
  }

  return {
    verified: false,
    verificationState: "unsupported_product",
    provider: "billing_abstraction",
    reason: "Unsupported product for billing verification",
  };
}
