/* eslint-disable quotes, object-curly-spacing, arrow-parens, operator-linebreak, indent, max-len, quote-props */
import {
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'crypto';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions';
import { onRequest } from 'firebase-functions/https';
import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onObjectFinalized } from 'firebase-functions/v2/storage';
import {
  createStripeCheckoutSession,
  verifyBillingPurchase,
} from './billing.provider';
import {
  buildAppleCalendarEvent,
  buildGoogleCalendarEvent,
  buildIcsEvent,
} from './calendar.provider';
import { sendEmail } from './email.provider';
import {
  readIntegrationCache,
  writeIntegrationCache,
} from './integration.cache';
import { getIntegrationConfig } from './integrations.config';
import { lookupOwnerManuals } from './manuals.provider';
import { enforceRateLimit, requireAuthenticatedUser } from './request.guards';
import { buildMaintenancePlan } from './schedule.provider';
import { lookupWarrantySummary } from './warranty.provider';

// Initialize Firebase Admin
admin.initializeApp();

// TypeScript interfaces for Firebase Functions
interface Vehicle {
  uid?: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  purchaseDate?: string;
  nextDueOilChange?: string;
  nextDueTireRotation?: string;
  nextDueBrakeInspection?: string;
}

interface MaintenanceItem {
  title: string;
  dueDate: string;
  type: string;
}

interface MaintenanceEntry {
  id?: string;
  title?: string;
  date: string | Date | Timestamp;
  mileage?: number;
  notes?: string;
}

interface LocalServiceProvider {
  id: string;
  type: 'repair_shop' | 'dealership' | 'body_shop' | 'car_wash' | 'detailer';
  name: string;
  distanceMiles: number;
  address: string;
  phone: string;
  website: string;
  rating: number;
  specialties: string[];
}

interface ReminderSweepSummary {
  usersScanned: number;
  vehiclesScanned: number;
  remindersSent: number;
  reminderFailures: number;
  pushSent: number;
  pushFailures: number;
}

interface ReminderSweepDependencies {
  queryDocuments: (
    collection: string,
    options?: {
      filters?: Array<{
        field: string;
        operator: admin.firestore.WhereFilterOp;
        value: unknown;
      }>;
      orderBy?: { field: string; direction: 'asc' | 'desc' };
      limit?: number;
      offset?: number;
    }
  ) => Promise<any[]>;
  getUpcomingMaintenance: (
    vehicle: Vehicle,
    daysAhead?: number
  ) => Promise<MaintenanceItem[]>;
  sendReminderEmail: (
    email: string,
    vehicle: Vehicle,
    maintenanceItems: MaintenanceItem[]
  ) => Promise<void>;
  sendPushNotification: (
    fcmToken: string,
    vehicle: Vehicle,
    maintenanceItems: MaintenanceItem[]
  ) => Promise<void>;
}

interface ReminderScheduleRunDependencies {
  runSweep: () => Promise<ReminderSweepSummary>;
  onInfo: (message: string, payload?: unknown) => void;
  onError: (message: string, error: unknown) => void;
}

interface SupportAuthToken {
  email?: string;
  superAdmin?: boolean;
  admin?: boolean;
  supportAdmin?: boolean;
}

interface SupportAuthContext {
  uid?: string;
  token?: SupportAuthToken;
}

interface SupportAccessContext {
  isSuperAdmin: boolean;
  accessReason: string;
}

interface SupportUserSummary {
  uid: string;
  email: string;
  displayName: string;
  disabled: boolean;
  createdAt: string | null;
  lastSignInTime: string | null;
  subscriptionTier: string;
  subscriptionStatus: string;
  vehicleCount: number;
  premiumActive: boolean;
  premiumVerified: boolean;
  vehicleLimit: number;
}

type UserTier = 'free' | 'pro' | 'premium' | 'enterprise';

type OrgRole =
  | 'org_owner'
  | 'org_admin'
  | 'support_agent'
  | 'billing_admin'
  | 'read_only';

type GarageStorageMode = 'user_scoped' | 'dual_write' | 'org_scoped';

interface EffectiveEntitlements {
  orgId: string;
  tier: UserTier;
  vehicleLimit: number;
  features: Record<string, boolean>;
}

interface ApiAccessKeyMetadata {
  keyId: string;
  label: string;
  keyPrefix: string;
  active: boolean;
  createdAt: unknown;
  updatedAt: unknown;
  lastUsedAt: unknown;
  revokedAt: unknown;
  keyHash?: string;
}

interface InvoiceLineItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface InvoiceDraftInput {
  orgId?: string;
  customerName?: string;
  issueDate?: string;
  dueDate?: string;
  currency?: string;
  amountDue?: number;
  notes?: string;
  lineItems?: InvoiceLineItemInput[];
}

interface PayableDraftInput {
  orgId?: string;
  vendorName?: string;
  billDate?: string;
  dueDate?: string;
  currency?: string;
  amountDue?: number;
  category?: string;
  notes?: string;
}

interface IdempotencyReservation {
  isReplay: boolean;
  result?: Record<string, unknown>;
  ref?: admin.firestore.DocumentReference;
}

const parseCsvEnvList = (value: string | undefined): string[] =>
  (value || '')
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);

const SUPER_ADMIN_EMAILS = parseCsvEnvList(process.env.SUPER_ADMIN_EMAILS);
const SUPER_ADMIN_UIDS = parseCsvEnvList(process.env.SUPER_ADMIN_UIDS);

const ROLE_RANK: Record<OrgRole, number> = {
  org_owner: 5,
  org_admin: 4,
  billing_admin: 3,
  support_agent: 2,
  read_only: 1,
};

const tierRank = (tier: UserTier): number => {
  switch (tier) {
    case 'enterprise':
      return 4;
    case 'premium':
      return 3;
    case 'pro':
      return 2;
    default:
      return 1;
  }
};

const normalizeTier = (tier: unknown): UserTier => {
  const value = (tier || 'free').toString();
  if (value === 'enterprise' || value === 'premium' || value === 'pro') {
    return value;
  }

  return 'free';
};

const getVehicleLimitForTier = (tier: UserTier): number => {
  switch (tier) {
    case 'enterprise':
      return 999999;
    case 'premium':
      return 25;
    case 'pro':
      return 10;
    default:
      return 2;
  }
};

const getFeatureSetForTier = (tier: UserTier): Record<string, boolean> => ({
  vehicle_limit: true,
  advanced_reminders: tier !== 'free',
  calendar_sync: tier !== 'free',
  pdf_export: tier !== 'free',
  excel_export: tier !== 'free',
  ai_analysis: tier !== 'free',
  ai_predictions: tier === 'premium' || tier === 'enterprise',
  cloud_sync: tier === 'premium' || tier === 'enterprise',
  maintenance_planning_12mo: tier !== 'free',
  maintenance_planning_36mo: tier === 'premium' || tier === 'enterprise',
  ad_free: tier === 'premium' || tier === 'enterprise',
  reduced_ads: tier !== 'free',
  priority_support: tier !== 'free',
  phone_support: tier === 'premium' || tier === 'enterprise',
  multi_vehicle_dashboard: tier !== 'free',
  api_access: tier === 'premium' || tier === 'enterprise',
  zapier_integration: tier === 'premium' || tier === 'enterprise',
});

const getDefaultOrgId = (uid: string): string => `personal_${uid}`;

const normalizeMoneyAmount = (value: unknown): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new HttpsError(
      'invalid-argument',
      'Amount values must be numeric and non-negative'
    );
  }

  return Math.round(parsed * 100) / 100;
};

const toOrgRole = (value: unknown): OrgRole => {
  const role = (value || 'read_only').toString() as OrgRole;
  return ROLE_RANK[role] ? role : 'read_only';
};

const normalizeGarageStorageMode = (
  value: unknown
): GarageStorageMode => {
  const mode = (value || 'user_scoped').toString() as GarageStorageMode;
  if (
    mode === 'dual_write' ||
    mode === 'org_scoped' ||
    mode === 'user_scoped'
  ) {
    return mode;
  }

  return 'user_scoped';
};

async function writeAuditEvent(params: {
  orgId: string;
  actorUid: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, unknown>;
}) {
  const db = admin.firestore();
  await db.collection(`orgs/${params.orgId}/audit`).add({
    actorUid: params.actorUid,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    details: params.details || {},
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function ensurePersonalOrganization(
  uid: string,
  email?: string | null
): Promise<string> {
  const db = admin.firestore();
  const orgId = getDefaultOrgId(uid);
  const orgRef = db.doc(`orgs/${orgId}`);
  const memberRef = db.doc(`orgs/${orgId}/members/${uid}`);
  const userMembershipRef = db.doc(`users/${uid}/orgMemberships/${orgId}`);

  const [orgSnap, memberSnap] = await Promise.all([
    orgRef.get(),
    memberRef.get(),
  ]);

  const batch = db.batch();

  if (!orgSnap.exists) {
    batch.set(orgRef, {
      orgId,
      name: `Personal Garage (${uid.slice(0, 6)})`,
      type: 'personal',
      garageStorageMode: 'user_scoped',
      planTier: 'free',
      createdByUid: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  if (!memberSnap.exists) {
    batch.set(memberRef, {
      uid,
      email: (email || '').toString(),
      role: 'org_owner',
      status: 'active',
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  batch.set(
    userMembershipRef,
    {
      orgId,
      role: 'org_owner',
      status: 'active',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await batch.commit();
  return orgId;
}

async function getPrimaryOrgIdForUser(uid: string): Promise<string> {
  const db = admin.firestore();
  const memberships = await db
    .collection(`users/${uid}/orgMemberships`)
    .where('status', '==', 'active')
    .limit(1)
    .get();

  if (!memberships.empty) {
    return memberships.docs[0].id;
  }

  return ensurePersonalOrganization(uid);
}

// Mirrors packages/shared/src/firestoreServiceFactory.js's
// resolveGarageContext/resolveVehicleScope: for org_scoped or dual_write
// garages, vehicles live under orgs/{orgId}/vehicles instead of
// users/{uid}/vehicles. Server-side callers that write vehicle-scoped data
// (e.g. webhooks) must resolve the same root the client reads from, or
// writes land in a collection the app never looks at. Read-only: does not
// create an organization if none exists.
async function resolveVehicleCollectionRoot(uid: string): Promise<string> {
  const db = admin.firestore();
  const memberships = await db
    .collection(`users/${uid}/orgMemberships`)
    .where('status', '==', 'active')
    .limit(1)
    .get();

  if (memberships.empty) {
    return `users/${uid}/vehicles`;
  }

  const orgId = memberships.docs[0].id;
  const orgSnap = await db.doc(`orgs/${orgId}`).get();
  const garageStorageMode = normalizeGarageStorageMode(
    orgSnap.data()?.garageStorageMode
  );

  if (garageStorageMode === 'org_scoped' || garageStorageMode === 'dual_write') {
    return `orgs/${orgId}/vehicles`;
  }

  return `users/${uid}/vehicles`;
}

async function resolveEffectiveEntitlements(
  uid: string,
  requestedOrgId?: string
): Promise<EffectiveEntitlements> {
  const db = admin.firestore();
  const fallbackOrgId = await getPrimaryOrgIdForUser(uid);
  const orgId = requestedOrgId || fallbackOrgId;

  const [subscriptionSnap, premiumSnap, orgSnap] = await Promise.all([
    db.doc(`users/${uid}/subscription/current`).get(),
    db.doc(`users/${uid}/entitlements/premium`).get(),
    db.doc(`orgs/${orgId}`).get(),
  ]);

  const subscriptionTier = normalizeTier(subscriptionSnap.data()?.tier);
  const premiumActive = premiumSnap.data()?.active === true;
  const orgTier = normalizeTier(orgSnap.data()?.planTier);

  let effectiveTier = subscriptionTier;
  if (tierRank(orgTier) > tierRank(effectiveTier)) {
    effectiveTier = orgTier;
  }
  if (premiumActive) {
    effectiveTier = 'premium';
  }

  return {
    orgId,
    tier: effectiveTier,
    vehicleLimit: getVehicleLimitForTier(effectiveTier),
    features: getFeatureSetForTier(effectiveTier),
  };
}

const hashApiAccessKey = (rawKey: string): string => {
  const salt =
    (
      process.env.API_KEY_HASH_SALT ||
      process.env.GCLOUD_PROJECT ||
      'vehicle-vitals'
    )
      .toString()
      .trim() || 'vehicle-vitals';
  return scryptSync(rawKey, salt, 64).toString('hex');
};

const resolveFunctionBaseUrl = (): string => {
  const explicit = (process.env.API_WEBHOOK_BASE_URL || '').trim();
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }

  const projectId = (
    process.env.GCLOUD_PROJECT ||
    process.env.FIREBASE_PROJECT ||
    admin.app().options.projectId ||
    ''
  )
    .toString()
    .trim();
  if (!projectId) {
    return '';
  }

  return `https://us-central1-${projectId}.cloudfunctions.net`;
};

const getRequestBodyBuffer = (request: {
  rawBody?: unknown;
  body?: unknown;
}): Buffer => {
  const rawBody = request.rawBody;
  if (Buffer.isBuffer(rawBody)) {
    return rawBody;
  }

  if (typeof request.body === 'string') {
    return Buffer.from(request.body, 'utf8');
  }

  return Buffer.from(JSON.stringify(request.body || {}), 'utf8');
};

const isWebhookSignatureValid = (
  request: {
    headers: Record<string, unknown>;
    rawBody?: unknown;
    body?: unknown;
  },
  secret: string
): boolean => {
  const rawSignature = (
    request.headers['x-vv-signature'] ||
    request.headers['x-zapier-signature'] ||
    ''
  )
    .toString()
    .trim();
  if (!rawSignature) {
    return false;
  }

  const normalizedSignature = rawSignature.startsWith('sha256=')
    ? rawSignature.slice(7)
    : rawSignature;
  if (!/^[a-f0-9]{64}$/i.test(normalizedSignature)) {
    return false;
  }

  const expectedSignature = createHmac('sha256', secret)
    .update(getRequestBodyBuffer(request))
    .digest('hex');

  const providedBuffer = Buffer.from(normalizedSignature.toLowerCase(), 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
};

const parseStripeSignatureHeader = (
  signatureHeaderRaw: string
): { timestamp: string; v1: string } | null => {
  const signatureHeader = (signatureHeaderRaw || '').toString().trim();
  if (!signatureHeader) {
    return null;
  }

  const segments = signatureHeader.split(',');
  let timestamp = '';
  let v1 = '';

  for (const segment of segments) {
    const [key, value] = segment.split('=');
    if (key === 't' && value) {
      timestamp = value.trim();
    }
    if (key === 'v1' && value) {
      v1 = value.trim();
    }
  }

  if (!timestamp || !v1) {
    return null;
  }

  return { timestamp, v1 };
};

const isStripeWebhookSignatureValid = (
  request: {
    headers: Record<string, unknown>;
    rawBody?: unknown;
    body?: unknown;
  },
  secret: string
): boolean => {
  const parsed = parseStripeSignatureHeader(
    (request.headers['stripe-signature'] || '').toString()
  );
  if (!parsed) {
    return false;
  }

  const toleranceSeconds = 5 * 60;
  const timestampNumber = Number(parsed.timestamp);
  if (!Number.isFinite(timestampNumber)) {
    return false;
  }

  if (
    Math.abs(Math.floor(Date.now() / 1000) - timestampNumber) > toleranceSeconds
  ) {
    return false;
  }

  const payloadBuffer = getRequestBodyBuffer(request);
  const signedPayload = `${parsed.timestamp}.${payloadBuffer.toString('utf8')}`;
  const expectedSignature = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  if (!/^[a-f0-9]{64}$/i.test(parsed.v1)) {
    return false;
  }

  const provided = Buffer.from(parsed.v1.toLowerCase(), 'hex');
  const expected = Buffer.from(expectedSignature, 'hex');

  if (provided.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(expected, provided);
};

const getStripePriceLookup = (): Record<string, UserTier> => {
  const mapping: Record<string, UserTier> = {};
  const candidates: Array<{ envName: string; tier: UserTier }> = [
    { envName: 'STRIPE_PRICE_ID_PRO_MONTHLY', tier: 'pro' },
    { envName: 'STRIPE_PRICE_ID_PRO_ANNUAL', tier: 'pro' },
    { envName: 'STRIPE_PRICE_ID_PREMIUM_MONTHLY', tier: 'premium' },
    { envName: 'STRIPE_PRICE_ID_PREMIUM_ANNUAL', tier: 'premium' },
  ];

  for (const candidate of candidates) {
    const value = (process.env[candidate.envName] || '').toString().trim();
    if (value) {
      mapping[value] = candidate.tier;
    }
  }

  return mapping;
};

const getPriceIdFromStripeObject = (objectData: any): string => {
  const primaryPriceId =
    objectData?.display_items?.[0]?.price?.id ||
    objectData?.line_items?.data?.[0]?.price?.id ||
    objectData?.items?.data?.[0]?.price?.id ||
    objectData?.plan?.id ||
    objectData?.price?.id;

  return (primaryPriceId || '').toString().trim();
};

const resolveSubscriptionTierFromStripeObject = (
  objectData: any
): UserTier | null => {
  const metadataTier = (
    objectData?.metadata?.targetTier ||
    objectData?.metadata?.tier ||
    ''
  )
    .toString()
    .trim()
    .toLowerCase();

  if (metadataTier === 'pro' || metadataTier === 'premium') {
    return metadataTier as UserTier;
  }

  const priceId = getPriceIdFromStripeObject(objectData);
  if (!priceId) {
    return null;
  }

  const priceLookup = getStripePriceLookup();
  return priceLookup[priceId] || null;
};

const resolveBillingPeriodFromStripeObject = (
  objectData: any
): 'monthly' | 'annual' => {
  const metadataPeriod = (objectData?.metadata?.billingPeriod || '')
    .toString()
    .trim()
    .toLowerCase();
  if (metadataPeriod === 'annual') {
    return 'annual';
  }

  const interval =
    objectData?.items?.data?.[0]?.price?.recurring?.interval ||
    objectData?.line_items?.data?.[0]?.price?.recurring?.interval ||
    objectData?.plan?.interval ||
    objectData?.price?.recurring?.interval;

  return interval === 'year' ? 'annual' : 'monthly';
};

const resolveSubscriptionStatusFromStripeObject = (
  objectData: any
): 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired' => {
  const status = (objectData?.status || '').toString().trim().toLowerCase();

  if (status === 'trialing') {
    return 'trialing';
  }
  if (status === 'past_due' || status === 'unpaid' || status === 'incomplete') {
    return 'past_due';
  }
  if (
    status === 'canceled' ||
    status === 'cancelled' ||
    status === 'incomplete_expired'
  ) {
    return 'canceled';
  }

  return 'active';
};

const resolveUidFromStripeObject = async (objectData: any): Promise<string> => {
  const metadataUid = (objectData?.metadata?.uid || '').toString().trim();
  if (metadataUid) {
    return metadataUid;
  }

  const customerId = (objectData?.customer || '').toString().trim();
  if (!customerId) {
    return '';
  }

  const customerLookup = await admin
    .firestore()
    .doc(`stripeCustomerLookup/${customerId}`)
    .get();

  return (customerLookup.data()?.uid || '').toString().trim();
};

const toTimestampFromUnixSeconds = (value: unknown): Timestamp | null => {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }

  return Timestamp.fromDate(new Date(numeric * 1000));
};

async function applySubscriptionTierState(params: {
  uid: string;
  targetTier: Exclude<UserTier, 'enterprise'>;
  billingPeriod: 'monthly' | 'annual';
  status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';
  paymentMethod?: 'stripe' | 'app_store' | 'play_store' | null;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  lastPaymentError?: string | null;
  verificationState?: string;
}): Promise<{
  previousTier: UserTier;
  orgId: string;
  entitlements: EffectiveEntitlements;
}> {
  const db = admin.firestore();
  const subscriptionRef = db.doc(`users/${params.uid}/subscription/current`);
  const premiumEntitlementRef = db.doc(
    `users/${params.uid}/entitlements/premium`
  );
  const now = Timestamp.now();

  const renewalDate =
    params.targetTier === 'free'
      ? null
      : Timestamp.fromDate(
          new Date(
            Date.now() +
              (params.billingPeriod === 'annual'
                ? 365 * 24 * 60 * 60 * 1000
                : 30 * 24 * 60 * 60 * 1000)
          )
        );

  let previousTier: UserTier = 'free';

  await db.runTransaction(async tx => {
    const currentSubscriptionSnap = await tx.get(subscriptionRef);
    previousTier = normalizeTier(currentSubscriptionSnap.data()?.tier);

    tx.set(
      subscriptionRef,
      {
        tier: params.targetTier,
        status: params.status || 'active',
        currentPeriodStart: now,
        currentPeriodEnd: renewalDate,
        renewalDate,
        autoRenew: params.targetTier !== 'free',
        paymentMethod:
          params.paymentMethod === undefined
            ? params.targetTier === 'free'
              ? null
              : 'stripe'
            : params.paymentMethod,
        stripeCustomerId: (params.stripeCustomerId || '').toString() || null,
        stripeSubscriptionId:
          (params.stripeSubscriptionId || '').toString() || null,
        lastPaymentError:
          params.lastPaymentError === undefined
            ? null
            : params.lastPaymentError,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    if (params.targetTier === 'premium') {
      tx.set(
        premiumEntitlementRef,
        {
          active: true,
          verified: false,
          verificationState: (
            params.verificationState || 'simulated_checkout'
          ).toString(),
          verificationProvider: 'subscription_settlement',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    if (previousTier === 'premium' && params.targetTier !== 'premium') {
      tx.set(
        premiumEntitlementRef,
        {
          active: false,
          verified: false,
          verificationState: 'revoked_by_downgrade',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
  });

  const orgId = await ensurePersonalOrganization(params.uid);
  const entitlements = await resolveEffectiveEntitlements(params.uid, orgId);

  return {
    previousTier,
    orgId,
    entitlements,
  };
}

async function requireFeatureEntitlement(
  uid: string,
  featureName: string
): Promise<EffectiveEntitlements> {
  const entitlements = await resolveEffectiveEntitlements(uid);
  if (!entitlements.features?.[featureName]) {
    throw new HttpsError(
      'permission-denied',
      `${featureName} is not enabled for the current subscription`
    );
  }

  return entitlements;
}

async function requireOrgRole(
  uid: string,
  orgId: string,
  allowedRoles: OrgRole[]
): Promise<OrgRole> {
  const db = admin.firestore();
  const memberSnap = await db.doc(`orgs/${orgId}/members/${uid}`).get();

  if (!memberSnap.exists) {
    throw new HttpsError('permission-denied', 'User is not an org member');
  }

  const role = toOrgRole(memberSnap.data()?.role);
  if (!allowedRoles.includes(role)) {
    throw new HttpsError('permission-denied', 'Insufficient organization role');
  }

  return role;
}

async function reserveIdempotencyKey(params: {
  uid: string;
  operation: string;
  idempotencyKey?: string;
}): Promise<IdempotencyReservation> {
  const key = (params.idempotencyKey || '').trim();
  if (!key) {
    return { isReplay: false };
  }

  const db = admin.firestore();
  const digest = createHash('sha256')
    .update(`${params.uid}:${params.operation}:${key}`)
    .digest('hex');
  const ref = db.doc(`idempotencyKeys/${digest}`);
  const snap = await ref.get();

  if (snap.exists) {
    const data = snap.data() || {};
    if (data.status === 'completed' && typeof data.result === 'object') {
      return {
        isReplay: true,
        result: data.result as Record<string, unknown>,
      };
    }

    throw new HttpsError(
      'already-exists',
      'Duplicate idempotency key is currently processing'
    );
  }

  await ref.create({
    uid: params.uid,
    operation: params.operation,
    status: 'in_progress',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { isReplay: false, ref };
}

async function completeIdempotencyKey(
  reservation: IdempotencyReservation,
  result: Record<string, unknown>
) {
  if (!reservation.ref) {
    return;
  }

  await reservation.ref.set(
    {
      status: 'completed',
      result,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

async function markIdempotencyFailed(
  reservation: IdempotencyReservation,
  reason: string
) {
  if (!reservation.ref) {
    return;
  }

  await reservation.ref.set(
    {
      status: 'failed',
      error: reason,
      failedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

const getSupportAccessContext = (request: {
  auth?: SupportAuthContext;
}): SupportAccessContext => {
  const auth = request.auth;

  if (!auth) {
    return { isSuperAdmin: false, accessReason: 'Missing auth context' };
  }

  const uid = (auth.uid || '').toLowerCase();
  const email = (auth.token?.email || '').toLowerCase();
  const token = auth.token || {};
  const isClaimedAdmin =
    token.superAdmin === true ||
    token.admin === true ||
    token.supportAdmin === true;
  const isAllowlisted =
    SUPER_ADMIN_UIDS.includes(uid) || SUPER_ADMIN_EMAILS.includes(email);

  if (isClaimedAdmin) {
    return { isSuperAdmin: true, accessReason: 'Granted by custom claim' };
  }

  if (isAllowlisted) {
    return {
      isSuperAdmin: true,
      accessReason: 'Granted by environment allowlist',
    };
  }

  return {
    isSuperAdmin: false,
    accessReason: 'User is not a super-administrator',
  };
};

const requireSuperAdmin = (request: {
  auth?: SupportAuthContext;
}): SupportAccessContext => {
  const access = getSupportAccessContext(request);

  if (!access.isSuperAdmin) {
    throw new HttpsError('permission-denied', access.accessReason);
  }

  return access;
};

const buildSupportUserSummary = async (
  userRecord: admin.auth.UserRecord
): Promise<SupportUserSummary> => {
  const uid = userRecord.uid;
  const db = admin.firestore();
  const subscriptionSnap = await db
    .doc(`users/${uid}/subscription/current`)
    .get();
  const entitlementSnap = await db
    .doc(`users/${uid}/entitlements/premium`)
    .get();
  const vehicleSnap = await db.collection(`users/${uid}/vehicles`).get();

  const subscription = subscriptionSnap.data() || {};
  const entitlement = entitlementSnap.data() || {};
  const vehicleCount = vehicleSnap.docs.filter(
    doc => doc.id !== 'preferences'
  ).length;
  const tier = (subscription.tier || 'free').toString();

  return {
    uid,
    email: (userRecord.email || '').toString(),
    displayName: (userRecord.displayName || '').toString(),
    disabled: userRecord.disabled === true,
    createdAt: userRecord.metadata.creationTime || null,
    lastSignInTime: userRecord.metadata.lastSignInTime || null,
    subscriptionTier: tier,
    subscriptionStatus: (subscription.status || 'active').toString(),
    vehicleCount,
    premiumActive: entitlement.active === true,
    premiumVerified: entitlement.verified === true,
    vehicleLimit:
      tier === 'enterprise'
        ? 999999
        : tier === 'premium'
          ? 25
          : tier === 'pro'
            ? 10
            : 2,
  };
};

const TRANSFERABLE_VEHICLE_SUBCOLLECTIONS = [
  'maintenance',
  'reminders',
  'attachmentAnalyses',
];

// Copies (not moves) every user-scoped vehicle into the org's vehicle
// collection when a garage is promoted into org_scoped/dual_write mode.
// Without this, existing vehicles stay invisible to the org-scoped list
// query the client switches to, and quota checks see an empty garage —
// dual_write in particular is meant to keep the user-scoped copy valid
// during the transition, so this deliberately does not delete the source.
async function copyUserVehiclesIntoOrg(params: {
  uid: string;
  orgId: string;
}): Promise<number> {
  const db = admin.firestore();
  const sourceVehiclesSnap = await db
    .collection(`users/${params.uid}/vehicles`)
    .get();

  const vins = sourceVehiclesSnap.docs
    .map(doc => doc.id)
    .filter(id => id !== 'preferences');

  let copiedCount = 0;
  for (const vin of vins) {
    const sourceVehicleRef = db.doc(`users/${params.uid}/vehicles/${vin}`);
    const targetVehicleRef = db.doc(`orgs/${params.orgId}/vehicles/${vin}`);
    const targetSnap = await targetVehicleRef.get();
    if (targetSnap.exists) {
      continue;
    }

    const sourceSnap = await sourceVehicleRef.get();
    if (!sourceSnap.exists) {
      continue;
    }

    const batch = db.batch();
    batch.set(
      targetVehicleRef,
      {
        ...sourceSnap.data(),
        copiedFromUserScopedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    for (const subcollectionName of TRANSFERABLE_VEHICLE_SUBCOLLECTIONS) {
      const subSnap = await sourceVehicleRef
        .collection(subcollectionName)
        .get();
      subSnap.docs.forEach(docSnap => {
        batch.set(
          targetVehicleRef.collection(subcollectionName).doc(docSnap.id),
          docSnap.data(),
          { merge: true }
        );
      });
    }

    await batch.commit();
    copiedCount += 1;
  }

  return copiedCount;
}

async function resolveVehicleTransferTarget(params: {
  recipientUid?: unknown;
  recipientEmail?: unknown;
}): Promise<{ uid: string; email: string }> {
  const explicitUid = (params.recipientUid || '').toString().trim();
  if (explicitUid) {
    const userRecord = await admin.auth().getUser(explicitUid);
    return {
      uid: userRecord.uid,
      email: (userRecord.email || '').toString(),
    };
  }

  const recipientEmail = (params.recipientEmail || '').toString().trim();
  if (!recipientEmail) {
    throw new HttpsError(
      'invalid-argument',
      'recipientEmail or recipientUid is required'
    );
  }

  try {
    const userRecord = await admin.auth().getUserByEmail(recipientEmail);
    return {
      uid: userRecord.uid,
      email: (userRecord.email || recipientEmail).toString(),
    };
  } catch (error) {
    throw new HttpsError(
      'not-found',
      'Recipient account was not found for that email'
    );
  }
}

async function queueVehicleTransferOperations(params: {
  batch: admin.firestore.WriteBatch;
  sourceVehicleRef: admin.firestore.DocumentReference;
  targetVehicleRef: admin.firestore.DocumentReference;
  sourceVehicleData: Record<string, unknown>;
  actorUid: string;
  recipientUid: string;
}) {
  params.batch.set(
    params.targetVehicleRef,
    {
      ...params.sourceVehicleData,
      transferredFromUid: params.actorUid,
      transferredToUid: params.recipientUid,
      transferredAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  for (const subcollectionName of TRANSFERABLE_VEHICLE_SUBCOLLECTIONS) {
    const sourceSubcollection =
      params.sourceVehicleRef.collection(subcollectionName);
    const sourceSnapshot = await sourceSubcollection.get();

    sourceSnapshot.docs.forEach(docSnap => {
      const targetDocRef = params.targetVehicleRef
        .collection(subcollectionName)
        .doc(docSnap.id);
      params.batch.set(targetDocRef, docSnap.data(), { merge: true });
      params.batch.delete(docSnap.ref);
    });
  }

  params.batch.delete(params.sourceVehicleRef);
}

/**
 * Firestore CRUD helpers for Firebase Functions
 */
class FirestoreCrudHelpers {
  private static db = admin.firestore();

  /**
   * Query documents with filters
   * @param {string} collection The collection path to query
   * @param {object} options Query options including filters, ordering, limits
   * @return {Promise<any[]>} Array of documents with their data
   */
  static async queryDocuments(
    collection: string,
    options?: {
      filters?: Array<{
        field: string;
        operator: admin.firestore.WhereFilterOp;
        value: unknown;
      }>;
      orderBy?: { field: string; direction: 'asc' | 'desc' };
      limit?: number;
      offset?: number;
    }
  ): Promise<any[]> {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    let query: admin.firestore.Query = this.db.collection(collection);

    // Apply filters
    if (options?.filters) {
      options.filters.forEach(filter => {
        query = query.where(filter.field, filter.operator, filter.value);
      });
    }

    // Apply ordering
    if (options?.orderBy) {
      query = query.orderBy(options.orderBy.field, options.orderBy.direction);
    }

    // Apply limit
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    // Apply offset (startAfter) - simplified version
    if (options?.offset) {
      // In practice you'd need a document reference
      // query = query.startAfter(options.offset);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

interface AttachmentExtractedData {
  documentCategory: 'receipt' | 'invoice' | 'image' | 'document' | 'other';
  serviceType?: string;
  totalCost?: number;
  currency?: string;
  serviceDate?: string;
  mileage?: number;
}

function compactDefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  ) as T;
}

function inferDocumentCategory(
  fileName: string,
  mimeType?: string
): AttachmentExtractedData['documentCategory'] {
  const lower = fileName.toLowerCase();
  const mime = (mimeType || '').toLowerCase();

  if (lower.includes('receipt') || lower.includes('invoice')) {
    return lower.includes('invoice') ? 'invoice' : 'receipt';
  }

  if (mime.startsWith('image/')) {
    return 'image';
  }

  if (
    mime.includes('pdf') ||
    mime.includes('word') ||
    mime.includes('sheet') ||
    mime.includes('text')
  ) {
    return 'document';
  }

  return 'other';
}

function inferServiceType(fileName: string): string | undefined {
  const lower = fileName.toLowerCase();
  const mapping: Array<{ pattern: RegExp; label: string }> = [
    { pattern: /oil/, label: 'Oil Change' },
    { pattern: /tire|tyre|rotation/, label: 'Tire Service' },
    { pattern: /brake/, label: 'Brake Service' },
    { pattern: /battery/, label: 'Battery Service' },
    { pattern: /inspection/, label: 'Inspection' },
    { pattern: /alignment/, label: 'Alignment' },
  ];

  const match = mapping.find(item => item.pattern.test(lower));
  return match?.label;
}

function extractCost(value: string): number | undefined {
  const text = value.toLowerCase();
  const explicit =
    text.match(
      /(?:total|amount|invoice|paid|cost)\D{0,8}(\d{1,5}(?:[.,]\d{2})?)/i
    ) || text.match(/\$(\d{1,5}(?:[.,]\d{2})?)/);
  if (!explicit) return undefined;

  const normalized = explicit[1].replace(',', '.');
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return Number(parsed.toFixed(2));
}

function extractMileage(value: string): number | undefined {
  const mileageMatch = value.match(
    /(\d{1,3}(?:,\d{3})+|\d{4,6})\s?(?:mi|miles|km)\b/i
  );
  if (!mileageMatch) return undefined;
  const parsed = Number(mileageMatch[1].replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toIsoDate(date: Date): string | undefined {
  if (isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
}

function extractServiceDate(value: string): string | undefined {
  const isoMatch = value.match(/\b(\d{4})[-_/](\d{2})[-_/](\d{2})\b/);
  if (isoMatch) {
    return toIsoDate(
      new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T00:00:00Z`)
    );
  }

  const usMatch = value.match(/\b(\d{1,2})[-_/](\d{1,2})[-_/](\d{2,4})\b/);
  if (usMatch) {
    const month = usMatch[1].padStart(2, '0');
    const day = usMatch[2].padStart(2, '0');
    const year = usMatch[3].length === 2 ? `20${usMatch[3]}` : usMatch[3];
    return toIsoDate(new Date(`${year}-${month}-${day}T00:00:00Z`));
  }

  return undefined;
}

interface GeminiExtractedData {
  documentCategory?: string;
  serviceType?: string;
  totalCost?: number;
  currency?: string;
  serviceDate?: string;
  mileage?: number;
  rawText?: string;
}

async function callGeminiAnalysis(
  bucketName: string,
  objectPath: string,
  mimeType: string
): Promise<GeminiExtractedData | null> {
  try {
    const projectId =
      process.env.GCLOUD_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      admin.app().options.projectId;
    if (!projectId) {
      logger.warn('Gemini: no project ID available, skipping');
      return null;
    }

    // Download file bytes from Storage
    const bucket = admin.storage().bucket(bucketName);
    const file = bucket.file(objectPath);
    const [fileBuffer] = await file.download();
    const base64Data = fileBuffer.toString('base64');

    // Cap at 10 MB to avoid Gemini payload limits on very large files
    if (fileBuffer.byteLength > 10 * 1024 * 1024) {
      logger.warn('Gemini: file too large (>10 MB), skipping', { objectPath });
      return null;
    }

    const SUPPORTED_MIMES = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
      'image/gif',
    ];
    const effectiveMime = SUPPORTED_MIMES.includes(mimeType)
      ? mimeType
      : 'application/pdf';

    // Load Vertex SDK lazily so function discovery during deploy stays fast.
    const { VertexAI } = await import('@google-cloud/vertexai');

    const vertexAI = new VertexAI({
      project: projectId,
      location: 'us-central1',
    });
    const model = vertexAI.getGenerativeModel({
      model: 'gemini-2.0-flash-001',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0,
      },
    });

    const prompt = `You are a vehicle document parser. Analyze the attached document and extract structured data.

Return a JSON object with ONLY these fields (omit any field you cannot find):
{
  "documentCategory": "receipt" | "invoice" | "image" | "document" | "other",
  "serviceType": "short description of the service (e.g. Oil Change, Tire Rotation, Brake Service, Annual Inspection, etc.)",
  "totalCost": <number, dollars, no currency symbol>,
  "currency": "USD",
  "serviceDate": "YYYY-MM-DD",
  "mileage": <number, odometer reading if present>,
  "rawText": "full text content of the document in a single string"
}

Rules:
- Extract costs as plain numbers (e.g. 89.99, not "$89.99")
- If the document has multiple line items, use the grand total for totalCost
- Use the document date as serviceDate (not today's date)
- Omit any field that is not clearly present in the document
- For documentCategory: receipt = retail receipt, invoice = professional service invoice, image = photo with no text, document = general document`;

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType: effectiveMime, data: base64Data } },
          ],
        },
      ],
    });

    const responseText =
      result.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!responseText) return null;

    // Strip markdown code fences if Gemini wraps the JSON
    const cleaned = responseText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    const parsed = JSON.parse(cleaned) as GeminiExtractedData;
    return parsed;
  } catch (err) {
    logger.warn('Gemini analysis failed, falling back to heuristics', {
      error: String(err),
    });
    return null;
  }
}

function buildAttachmentAnalysis(
  objectName: string,
  mimeType: string | undefined,
  customMetadata: Record<string, string> | undefined,
  gemini?: GeminiExtractedData | null
): {
  extracted: AttachmentExtractedData;
  confidence: number;
  sourceText: string;
} {
  const fileName = objectName.split('/').pop() || objectName;
  const metadataText = [
    fileName,
    customMetadata?.title,
    customMetadata?.description,
    customMetadata?.notes,
    customMetadata?.ocrText,
    gemini?.rawText,
  ]
    .filter(Boolean)
    .join(' ');

  // Prefer Gemini-extracted values; fall back to heuristics for any missing field
  const heuristicCategory = inferDocumentCategory(fileName, mimeType);
  const heuristicServiceType = inferServiceType(metadataText);
  const heuristicCost = extractCost(metadataText);
  const heuristicDate = extractServiceDate(metadataText);
  const heuristicMileage = extractMileage(metadataText);

  const geminiCategory = gemini?.documentCategory as
    | AttachmentExtractedData['documentCategory']
    | undefined;
  const validCategories: AttachmentExtractedData['documentCategory'][] = [
    'receipt',
    'invoice',
    'image',
    'document',
    'other',
  ];

  const extracted = compactDefined({
    documentCategory:
      geminiCategory && validCategories.includes(geminiCategory)
        ? geminiCategory
        : heuristicCategory,
    serviceType: gemini?.serviceType || heuristicServiceType,
    totalCost:
      typeof gemini?.totalCost === 'number' ? gemini.totalCost : heuristicCost,
    currency: gemini?.currency || 'USD',
    serviceDate: gemini?.serviceDate || heuristicDate,
    mileage:
      typeof gemini?.mileage === 'number' ? gemini.mileage : heuristicMileage,
  }) as AttachmentExtractedData;

  const confidenceSignals = [
    extracted.documentCategory !== 'other',
    Boolean(extracted.serviceType),
    typeof extracted.totalCost === 'number',
    Boolean(extracted.serviceDate),
    typeof extracted.mileage === 'number',
  ].filter(Boolean).length;

  // Gemini analysis earns a base confidence bonus
  const geminiBonus = gemini ? 0.3 : 0;
  const confidence = Math.min(
    0.25 + geminiBonus + confidenceSignals * 0.1,
    0.95
  );

  return { extracted, confidence, sourceText: metadataText };
}

function parseAttachmentPath(path: string): {
  collectionRoot: string;
  ownerType: 'user' | 'org';
  ownerId: string;
  vin: string;
  section: 'maintenance' | 'records';
  parentId: string;
} | null {
  const userMatch = path.match(
    /^users\/([^/]+)\/vehicles\/([^/]+)\/(maintenance|records)\/([^/]+)\/.+/
  );
  if (userMatch) {
    return {
      collectionRoot: `users/${userMatch[1]}`,
      ownerType: 'user',
      ownerId: userMatch[1],
      vin: userMatch[2],
      section: userMatch[3] as 'maintenance' | 'records',
      parentId: userMatch[4],
    };
  }

  // Org-scoped garages (org_scoped/dual_write) store vehicles under
  // orgs/{orgId}/vehicles instead of users/{uid}/vehicles — attachments
  // uploaded there need the same analysis path.
  const orgMatch = path.match(
    /^orgs\/([^/]+)\/vehicles\/([^/]+)\/(maintenance|records)\/([^/]+)\/.+/
  );
  if (orgMatch) {
    return {
      collectionRoot: `orgs/${orgMatch[1]}`,
      ownerType: 'org',
      ownerId: orgMatch[1],
      vin: orgMatch[2],
      section: orgMatch[3] as 'maintenance' | 'records',
      parentId: orgMatch[4],
    };
  }

  return null;
}

async function upsertAttachmentAnalysis(params: {
  uid: string;
  vin: string;
  objectPath: string;
  bucket?: string | null;
  contentType?: string | null;
  sizeBytes?: number | null;
  customMetadata?: Record<string, string>;
  forceOcrText?: string;
  skipGemini?: boolean;
  // Only set for user-invoked calls (analyzeAttachmentTextCallable) where
  // `uid` is the authenticated caller and must be checked against the
  // storage path's actual owner/org. The storage finalize trigger has no
  // separate caller to validate against — the object path itself is the
  // source of truth — so it omits this.
  requireCallerMembership?: boolean;
}) {
  const {
    uid,
    vin,
    objectPath,
    bucket,
    contentType,
    sizeBytes,
    customMetadata,
    forceOcrText,
    skipGemini,
    requireCallerMembership,
  } = params;

  const pathContext = parseAttachmentPath(objectPath);
  if (!pathContext) {
    throw new HttpsError('invalid-argument', 'Invalid attachment storage path');
  }

  if (requireCallerMembership) {
    if (pathContext.ownerType === 'user') {
      if (pathContext.ownerId !== uid) {
        throw new HttpsError(
          'permission-denied',
          'Attachment path does not match authenticated user'
        );
      }
    } else {
      await requireOrgRole(uid, pathContext.ownerId, [
        'org_owner',
        'org_admin',
        'billing_admin',
        'support_agent',
        'read_only',
      ]);
    }
  }

  if (pathContext.vin !== vin) {
    throw new HttpsError(
      'invalid-argument',
      'Attachment path VIN does not match request VIN'
    );
  }

  const db = admin.firestore();
  const mergedMetadata = {
    ...(customMetadata || {}),
    ...(forceOcrText ? { ocrText: forceOcrText } : {}),
  };

  // Attempt Gemini analysis if we have a bucket reference and haven't been asked to skip
  let geminiResult: GeminiExtractedData | null = null;
  const effectiveBucket = bucket || admin.app().options.storageBucket || null;
  const geminiEnabledMimes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/gif',
  ];
  const mimeForGemini = (contentType || '').toLowerCase();
  const canUseGemini =
    !skipGemini &&
    !forceOcrText &&
    effectiveBucket &&
    (geminiEnabledMimes.includes(mimeForGemini) || mimeForGemini === '');

  if (canUseGemini && effectiveBucket) {
    logger.info('Running Gemini analysis', { objectPath, contentType });
    geminiResult = await callGeminiAnalysis(
      effectiveBucket,
      objectPath,
      mimeForGemini || 'application/pdf'
    );
    if (geminiResult) {
      logger.info('Gemini analysis succeeded', {
        objectPath,
        serviceType: geminiResult.serviceType,
        totalCost: geminiResult.totalCost,
        confidence: 'computed-after-merge',
      });
    }
  }

  const { extracted, confidence, sourceText } = buildAttachmentAnalysis(
    objectPath,
    contentType || undefined,
    mergedMetadata,
    geminiResult
  );

  const analysisDocId = encodeURIComponent(objectPath);
  const analysisData = {
    path: objectPath,
    bucket: bucket || null,
    contentType: contentType || null,
    sizeBytes: typeof sizeBytes === 'number' ? sizeBytes : null,
    fileName: objectPath.split('/').pop() || objectPath,
    section: pathContext.section,
    parentId: pathContext.parentId,
    extracted,
    confidence,
    sourceText,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db
    .doc(
      `${pathContext.collectionRoot}/vehicles/${vin}/attachmentAnalyses/${analysisDocId}`
    )
    .set(analysisData, { merge: true });

  if (
    pathContext.section === 'maintenance' &&
    !pathContext.parentId.startsWith('temp_')
  ) {
    const maintenanceRef = db.doc(
      `${pathContext.collectionRoot}/vehicles/${vin}/maintenance/${pathContext.parentId}`
    );
    const maintenanceSnap = await maintenanceRef.get();
    if (maintenanceSnap.exists) {
      const data = maintenanceSnap.data() || {};
      const attachments = Array.isArray(data.attachments)
        ? data.attachments
        : [];
      let changed = false;
      const nextAttachments = attachments.map((attachment: any) => {
        if (attachment?.path !== objectPath) {
          return attachment;
        }

        changed = true;
        return {
          ...attachment,
          analysis: {
            extracted,
            confidence,
            updatedAt: new Date().toISOString(),
          },
        };
      });

      if (changed) {
        await maintenanceRef.set(
          {
            attachments: nextAttachments,
            attachmentAnalysisUpdatedAt:
              admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    }
  }

  return {
    extracted,
    confidence,
    sourceText,
    section: pathContext.section,
    parentId: pathContext.parentId,
  };
}

const storageAttachmentAnalysisEnabled =
  (process.env.ENABLE_STORAGE_ATTACHMENT_ANALYSIS || 'true')
    .trim()
    .toLowerCase() !== 'false';

if (!storageAttachmentAnalysisEnabled) {
  logger.info(
    'Storage attachment analysis trigger disabled ' +
      '(set ENABLE_STORAGE_ATTACHMENT_ANALYSIS=true to enable)'
  );
}

export const analyzeUploadedAttachment = storageAttachmentAnalysisEnabled
  ? onObjectFinalized(async event => {
      const object = event.data;
      const objectName = object.name;
      if (!objectName) {
        logger.warn('Skipping storage finalize event with missing object name');
        return;
      }

      const pathContext = parseAttachmentPath(objectName);
      if (!pathContext) {
        return;
      }

      await upsertAttachmentAnalysis({
        // No separate caller here — the storage object path itself is the
        // source of truth, so this is passed through without
        // requireCallerMembership.
        uid: pathContext.ownerId,
        vin: pathContext.vin,
        objectPath: objectName,
        bucket: object.bucket,
        contentType: object.contentType || null,
        sizeBytes: Number(object.size || 0),
        customMetadata: object.metadata as Record<string, string> | undefined,
      });
    })
  : undefined;

export const analyzeAttachmentTextCallable = onCall(
  { timeoutSeconds: 120 },
  async request => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Missing auth context');
    }

    const {
      vin,
      storagePath,
      ocrText,
      contentType,
      bucket: bucketParam,
    } = (request.data as {
      vin?: string;
      storagePath?: string;
      ocrText?: string;
      contentType?: string;
      bucket?: string;
    }) ?? {};

    const normalizedVin = (vin || '').trim().toUpperCase();
    const normalizedPath = (storagePath || '').trim();
    const normalizedText = (ocrText || '').trim();

    if (!normalizedVin || normalizedVin.length !== 17) {
      throw new HttpsError(
        'invalid-argument',
        'Valid 17-character VIN required'
      );
    }

    if (!normalizedPath) {
      throw new HttpsError('invalid-argument', 'storagePath is required');
    }

    const result = await upsertAttachmentAnalysis({
      uid,
      vin: normalizedVin,
      objectPath: normalizedPath,
      bucket: (bucketParam || '').trim() || null,
      contentType: (contentType || '').trim() || null,
      forceOcrText: normalizedText || undefined,
      requireCallerMembership: true,
    });

    return {
      success: true,
      vin: normalizedVin,
      storagePath: normalizedPath,
      analysis: result,
    };
  }
);

async function lookupVinData(vinInput: string) {
  const vin = vinInput.trim().toUpperCase();
  if (vin.length !== 17) {
    throw new Error('Valid 17-character VIN required');
  }

  if (!hasValidVinChecksum(vin)) {
    throw new Error('Valid VIN checksum required');
  }

  logger.info(`Looking up VIN: ${vin.substring(0, 8)}...`);

  const nhtsaUrl =
    'https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/' +
    `${encodeURIComponent(vin)}?format=json`;
  const nhtsaResponse = await fetch(nhtsaUrl);

  if (!nhtsaResponse.ok) {
    throw new Error(`NHTSA API error: ${nhtsaResponse.status}`);
  }

  const data = await nhtsaResponse.json();
  const results = data?.Results || [];

  const sanitize = (value: string | undefined) => {
    const s = (value ?? '').toString().trim();
    if (!s) return '';
    const bad = new Set([
      '0',
      'NOT APPLICABLE',
      'NULL',
      'N/A',
      'NONE',
      'UNKNOWN',
    ]);
    return bad.has(s.toUpperCase()) ? '' : s;
  };

  const getVal = (key: string) =>
    sanitize(
      results.find(
        (r: { Variable: string; Value: string }) => r.Variable === key
      )?.Value
    );

  const vehicle = {
    vin,
    make: getVal('Make'),
    model: getVal('Model'),
    year: getVal('Model Year'),
    bodyClass: getVal('Body Class'),
    engineType: getVal('Engine Type'),
    fuelType: getVal('Fuel Type - Primary'),
    driveType: getVal('Drive Type'),
    transmissionStyle: getVal('Transmission Style'),
    trim: getVal('Trim'),
    vehicleType: getVal('Vehicle Type'),
  };

  const vehicleDesc = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  logger.info(`Successfully looked up VIN for ${vehicleDesc}`);

  return vehicle;
}

async function lookupNhtsaRecalls(vinInput: string) {
  const vin = vinInput.trim().toUpperCase();
  if (vin.length !== 17) {
    throw new Error('Valid 17-character VIN required');
  }

  if (!hasValidVinChecksum(vin)) {
    throw new Error('Valid VIN checksum required');
  }

  const recallsUrl =
    'https://api.nhtsa.gov/recalls/recallsByVehicle?vin=' +
    encodeURIComponent(vin);
  const recallsResponse = await fetch(recallsUrl);

  if (!recallsResponse.ok) {
    throw new Error(`NHTSA recalls API error: ${recallsResponse.status}`);
  }

  const recallsData = await recallsResponse.json();
  const recalls = Array.isArray(recallsData?.results)
    ? recallsData.results
    : [];

  return recalls.map((item: Record<string, unknown>) => ({
    campaignNumber: (item['NHTSACampaignNumber'] || '').toString(),
    reportReceivedDate: (item['ReportReceivedDate'] || '').toString(),
    component: (item['Component'] || '').toString(),
    summary: (item['Summary'] || '').toString(),
    consequence: (item['Conequence'] || item['Consequence'] || '').toString(),
    remedy: (item['Remedy'] || '').toString(),
    manufacturer: (item['Manufacturer'] || '').toString(),
  }));
}

function hashToSeed(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

const VIN_TRANSLITERATION: Record<string, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  F: 6,
  G: 7,
  H: 8,
  J: 1,
  K: 2,
  L: 3,
  M: 4,
  N: 5,
  P: 7,
  R: 9,
  S: 2,
  T: 3,
  U: 4,
  V: 5,
  W: 6,
  X: 7,
  Y: 8,
  Z: 9,
};

const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

function hasValidVinChecksum(vinInput: string): boolean {
  const vin = vinInput.trim().toUpperCase();

  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < vin.length; i += 1) {
    const char = vin[i];
    const parsedNumeric = Number(char);
    const numericValue = Number.isFinite(parsedNumeric)
      ? parsedNumeric
      : VIN_TRANSLITERATION[char];

    if (numericValue === undefined) {
      return false;
    }

    sum += numericValue * VIN_WEIGHTS[i];
  }

  const remainder = sum % 11;
  const expectedCheckDigit = remainder === 10 ? 'X' : String(remainder);
  return vin[8] === expectedCheckDigit;
}

function deterministicShuffle<T>(items: T[], seed: number): T[] {
  const copy = [...items];
  let currentSeed = seed;

  for (let i = copy.length - 1; i > 0; i--) {
    currentSeed = (currentSeed * 1664525 + 1013904223) >>> 0;
    const j = currentSeed % (i + 1);
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }

  return copy;
}

function normalizeLocationText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function buildLocalServiceProviders(
  locationQuery: string,
  radiusMiles: number,
  maxResults: number,
  vehicleMake?: string,
  providerTypeFilter:
    | 'all'
    | 'repair_shop'
    | 'dealership'
    | 'body_shop'
    | 'car_wash'
    | 'detailer' = 'all'
): LocalServiceProvider[] {
  const normalizedLocation = normalizeLocationText(locationQuery);
  const focusMake = (vehicleMake || '').trim();
  const seed = hashToSeed(`${normalizedLocation}:${focusMake}`);

  const repairShopTemplates = [
    { name: 'Precision Auto Care', specialties: ['Oil Change', 'Brakes'] },
    {
      name: 'Neighborhood Garage Works',
      specialties: ['Diagnostics', 'Engine Repair'],
    },
    {
      name: 'Summit Tire & Service',
      specialties: ['Tires', 'Alignment', 'Suspension'],
    },
    {
      name: 'Main Street Auto Clinic',
      specialties: ['Transmission', 'AC Service'],
    },
  ];

  const dealerTemplates = [
    {
      name: `${focusMake || 'Certified'} Auto Center`,
      specialties: ['Factory Service', 'Warranty Repairs'],
    },
    {
      name: `${focusMake || 'Premier'} Motors`,
      specialties: ['Certified Pre-Owned', 'Recall Service'],
    },
    {
      name: 'Metro Auto Dealership',
      specialties: ['OEM Parts', 'Service Packages'],
    },
  ];

  const providers: LocalServiceProvider[] = [
    ...repairShopTemplates.map((template, index) => ({
      id: `repair-${index + 1}`,
      type: 'repair_shop' as const,
      name: template.name,
      distanceMiles: Math.max(1, Math.min(radiusMiles, 2 + index * 3)),
      address: `${100 + index * 11} Service Ave, ${normalizedLocation}`,
      phone: `+1-555-01${(index + 10).toString()}`,
      website: `https://example.com/repair/${index + 1}`,
      rating: 4.2 + (index % 3) * 0.2,
      specialties: template.specialties,
    })),
    ...dealerTemplates.map((template, index) => ({
      id: `dealer-${index + 1}`,
      type: 'dealership' as const,
      name: template.name,
      distanceMiles: Math.max(2, Math.min(radiusMiles, 4 + index * 5)),
      address: `${400 + index * 13} Dealer Blvd, ${normalizedLocation}`,
      phone: `+1-555-02${(index + 20).toString()}`,
      website: `https://example.com/dealer/${index + 1}`,
      rating: 4.0 + (index % 3) * 0.3,
      specialties: template.specialties,
    })),
    {
      id: 'body-1',
      type: 'body_shop',
      name: 'Precision Collision Center',
      distanceMiles: Math.max(1, Math.min(radiusMiles, 3.5)),
      address: `520 Body Shop Way, ${normalizedLocation}`,
      phone: '+1-555-0310',
      website: 'https://example.com/body/1',
      rating: 4.4,
      specialties: ['Collision Repair', 'Paint Matching'],
    },
    {
      id: 'wash-1',
      type: 'car_wash',
      name: 'Sparkle Tunnel Wash',
      distanceMiles: Math.max(1, Math.min(radiusMiles, 2.2)),
      address: `250 Clean Car Ln, ${normalizedLocation}`,
      phone: '+1-555-0410',
      website: 'https://example.com/wash/1',
      rating: 4.3,
      specialties: ['Exterior Wash', 'Monthly Plans'],
    },
    {
      id: 'detail-1',
      type: 'detailer',
      name: 'Showroom Detail Studio',
      distanceMiles: Math.max(1, Math.min(radiusMiles, 4.1)),
      address: `680 Detailer Dr, ${normalizedLocation}`,
      phone: '+1-555-0510',
      website: 'https://example.com/detail/1',
      rating: 4.7,
      specialties: ['Interior Detailing', 'Ceramic Coating'],
    },
  ];

  const filteredProviders =
    providerTypeFilter === 'all'
      ? providers
      : providers.filter(provider => provider.type === providerTypeFilter);

  return deterministicShuffle(filteredProviders, seed)
    .slice(0, maxResults)
    .map((provider, index) => ({
      ...provider,
      distanceMiles: Number(
        Math.min(radiusMiles, provider.distanceMiles + index * 0.4).toFixed(1)
      ),
      rating: Number(Math.min(5, provider.rating).toFixed(1)),
    }));
}

// VIN lookup function
export const vinLookup = onRequest(
  { cors: true },
  async (request, response) => {
    try {
      // Only allow POST requests
      if (request.method !== 'POST') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
      }

      const { vin } = request.body;
      const normalizedVin = (vin || '').toString().trim().toUpperCase();
      if (!normalizedVin || normalizedVin.length !== 17) {
        response.status(400).json({ error: 'Valid 17-character VIN required' });
        return;
      }
      if (!hasValidVinChecksum(normalizedVin)) {
        response.status(400).json({ error: 'Valid VIN checksum required' });
        return;
      }
      const vehicle = await lookupVinData(normalizedVin);

      response.json({
        success: true,
        vehicle,
      });
    } catch (error) {
      logger.error('VIN lookup error:', error);
      response.status(500).json({
        success: false,
        error: 'Failed to look up VIN',
      });
    }
  }
);

export const vinLookupCallable = onCall(async request => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  const vin = (request.data?.vin || '').toString();
  const normalizedVin = vin.trim().toUpperCase();
  if (normalizedVin.length !== 17) {
    throw new HttpsError('invalid-argument', 'Valid 17-character VIN required');
  }

  if (!hasValidVinChecksum(normalizedVin)) {
    throw new HttpsError('invalid-argument', 'Valid VIN checksum required');
  }

  try {
    const vehicle = await lookupVinData(normalizedVin);
    return {
      success: true,
      vehicle,
    };
  } catch (error) {
    logger.error('VIN lookup callable error:', error);
    throw new HttpsError('internal', 'Failed to look up VIN');
  }
});

export const getVehicleInsightsCallable = onCall(async request => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  const vin = (request.data?.vin || '').toString();
  if (vin.length !== 17) {
    throw new HttpsError('invalid-argument', 'Valid 17-character VIN required');
  }

  const normalizedVin = vin.trim().toUpperCase();
  if (!hasValidVinChecksum(normalizedVin)) {
    throw new HttpsError('invalid-argument', 'Valid VIN checksum required');
  }

  try {
    const [vehicleResult, recallsResult] = await Promise.allSettled([
      lookupVinData(normalizedVin),
      lookupNhtsaRecalls(normalizedVin),
    ]);

    if (vehicleResult.status !== 'fulfilled') {
      logger.error('VIN profile lookup failed', {
        vinPrefix: normalizedVin.substring(0, 8),
        error: vehicleResult.reason,
      });
      throw new HttpsError('internal', 'Failed to look up VIN profile');
    }

    const vehicle = vehicleResult.value;
    const recalls =
      recallsResult.status === 'fulfilled' ? recallsResult.value : [];
    const recallsSource =
      recallsResult.status === 'fulfilled'
        ? 'NHTSA'
        : 'NHTSA (temporarily unavailable)';

    if (recallsResult.status !== 'fulfilled') {
      logger.warn('VIN recalls lookup failed, returning fallback recalls', {
        vinPrefix: normalizedVin.substring(0, 8),
        error: recallsResult.reason,
      });
    }

    const integrationConfig = getIntegrationConfig();

    return {
      success: true,
      vin: normalizedVin,
      free: {
        vinProfile: vehicle,
        recalls: {
          source: recallsSource,
          count: recalls.length,
          items: recalls,
        },
      },
      paid: {
        manuals: {
          enabled: integrationConfig.features.manualsEnabled,
          provider: integrationConfig.providers.manuals,
        },
        warranty: {
          enabled: integrationConfig.features.warrantyEnabled,
          provider: integrationConfig.providers.warranty,
        },
        maintenancePlan: {
          enabled: integrationConfig.features.maintenancePlanEnabled,
          provider: integrationConfig.providers.schedule,
        },
      },
      sources: {
        free: ['NHTSA vPIC', 'NHTSA Recalls API'],
        paid: [
          'Owner Manuals Provider',
          'Warranty Provider',
          'Maintenance Schedule Provider',
        ],
      },
      warnings:
        recallsResult.status === 'fulfilled'
          ? []
          : ['Recalls data temporarily unavailable; VIN profile returned.'],
    };
  } catch (error) {
    logger.error('Vehicle insights callable error:', error);
    throw new HttpsError('internal', 'Failed to fetch vehicle insights');
  }
});

export const getLocalServiceProvidersCallable = onCall(async request => {
  const authRequired =
    (process.env.INTEGRATION_AUTH_REQUIRED || 'true').trim().toLowerCase() !==
    'false';

  if (authRequired && !request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  const { locationQuery, radiusMiles, maxResults, vehicleMake, providerType } =
    (request.data as {
      locationQuery?: string;
      radiusMiles?: number;
      maxResults?: number;
      vehicleMake?: string;
      providerType?:
        | 'all'
        | 'repair_shop'
        | 'dealership'
        | 'body_shop'
        | 'car_wash'
        | 'detailer';
    }) ?? {};

  const normalizedLocation = normalizeLocationText(
    (locationQuery || '').toString()
  );
  if (!normalizedLocation || normalizedLocation.length < 5) {
    throw new HttpsError(
      'invalid-argument',
      'locationQuery is required to find nearby providers'
    );
  }

  const safeRadius = Number.isFinite(Number(radiusMiles))
    ? Math.max(5, Math.min(100, Number(radiusMiles)))
    : 25;
  const safeMaxResults = Number.isFinite(Number(maxResults))
    ? Math.max(1, Math.min(25, Number(maxResults)))
    : 8;
  const allowedProviderTypes = new Set([
    'all',
    'repair_shop',
    'dealership',
    'body_shop',
    'car_wash',
    'detailer',
  ]);
  const safeProviderType = allowedProviderTypes.has(providerType || '')
    ? (providerType as
        | 'all'
        | 'repair_shop'
        | 'dealership'
        | 'body_shop'
        | 'car_wash'
        | 'detailer')
    : 'all';

  const providers = buildLocalServiceProviders(
    normalizedLocation,
    safeRadius,
    safeMaxResults,
    vehicleMake,
    safeProviderType
  );

  return {
    success: true,
    source: 'location_fallback',
    locationQuery: normalizedLocation,
    radiusMiles: safeRadius,
    providerType: safeProviderType,
    providers,
  };
});

// Email reminder function
export const sendMaintenanceReminder = onRequest(
  {
    cors: true,
    secrets: ['WORKSPACE_SMTP_USER', 'WORKSPACE_SMTP_APP_PASSWORD'],
  },
  async (request, response) => {
    try {
      // Only allow POST requests
      if (request.method !== 'POST') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
      }

      const { email, vehicle, maintenanceItems } = request.body;

      if (
        !email ||
        !vehicle ||
        !maintenanceItems ||
        !Array.isArray(maintenanceItems)
      ) {
        response.status(400).json({
          error: 'Missing required fields: email, vehicle, maintenanceItems',
        });
        return;
      }

      logger.info(
        `Sending maintenance reminder to ${email} for ` +
          `${vehicle.make} ${vehicle.model}`
      );

      // sendEmail() logs in dev and sends via Google Workspace SMTP
      // when EMAIL_PROVIDER=workspace.
      const emailContent = {
        to: email,
        subject:
          `Maintenance Reminder: ${vehicle.make} ` +
          `${vehicle.model} (${vehicle.year})`,
        html:
          `
          <h2>Vehicle Maintenance Reminder</h2>
          <p>Your <strong>${vehicle.year} ${vehicle.make} ` +
          `${vehicle.model}</strong>
          (VIN: ${vehicle.vin}) is due for maintenance:</p>
          <ul>
            ${maintenanceItems
              .map(
                item =>
                  `<li><strong>${item.title}</strong> - Due: ${item.dueDate}</li>`
              )
              .join('')}
          </ul>
          <p>Please schedule these services soon to keep your vehicle ` +
          `in optimal condition.</p>
          <br>
          <p>Vehicle Vitals Team</p>
        `,
        text: `
          Vehicle Maintenance Reminder

          Your ${vehicle.year} ${vehicle.make} ${vehicle.model}
          (VIN: ${vehicle.vin}) is due for maintenance:

          ${maintenanceItems
            .map(item => `- ${item.title} - Due: ${item.dueDate}`)
            .join('\n')}

          Please schedule these services soon to keep your vehicle
          in optimal condition.

          Vehicle Vitals Team
        `,
      };

      await sendEmail(emailContent);

      response.json({
        success: true,
        message: 'Reminder email sent',
      });
    } catch (error) {
      logger.error('Email reminder error:', error);
      response.status(500).json({
        success: false,
        error: 'Failed to send reminder email',
      });
    }
  }
);

// Scheduled function to check for upcoming maintenance (runs daily)
export const checkMaintenanceReminders = onSchedule(
  {
    schedule: '0 9 * * *',
    secrets: ['WORKSPACE_SMTP_USER', 'WORKSPACE_SMTP_APP_PASSWORD'],
  },
  async () => {
    await runMaintenanceReminderSchedule();
  }
);

/**
 * Execute one scheduled reminder run with logging and error swallowing.
 * @param {Partial<ReminderScheduleRunDependencies>} dependencies Optional
 * injected dependencies for tests
 * @return {Promise<ReminderSweepSummary | null>} Sweep summary on success
 */
export async function runMaintenanceReminderSchedule(
  dependencies?: Partial<ReminderScheduleRunDependencies>
): Promise<ReminderSweepSummary | null> {
  const runSweep = dependencies?.runSweep || runMaintenanceReminderSweep;
  const onInfo = dependencies?.onInfo || logger.info;
  const onError = dependencies?.onError || logger.error;

  onInfo('Checking for maintenance reminders...');

  try {
    const summary = await runSweep();
    onInfo('Maintenance reminder check completed', summary);
    return summary;
  } catch (error) {
    onError('Error checking maintenance reminders:', error);
    return null;
  }
}

/**
 * Execute scheduled reminder eligibility checks and email dispatch.
 * @param {ReminderSweepDependencies} dependencies Optional injected deps
 * @return {Promise<ReminderSweepSummary>} Sweep counts for observability/tests
 */
export async function runMaintenanceReminderSweep(
  dependencies?: Partial<ReminderSweepDependencies>
): Promise<ReminderSweepSummary> {
  const queryDocuments =
    dependencies?.queryDocuments ||
    FirestoreCrudHelpers.queryDocuments.bind(FirestoreCrudHelpers);
  const resolveUpcomingMaintenance =
    dependencies?.getUpcomingMaintenance || getUpcomingMaintenance;
  const deliverReminderEmail =
    dependencies?.sendReminderEmail || sendReminderEmail;
  const deliverPushNotification =
    dependencies?.sendPushNotification || sendPushNotification;

  const users = await queryDocuments('users');

  let usersScanned = 0;
  let vehiclesScanned = 0;
  let remindersSent = 0;
  let reminderFailures = 0;
  let pushSent = 0;
  let pushFailures = 0;

  for (const user of users) {
    usersScanned += 1;

    const emailRemindersEnabled = user.emailRemindersEnabled !== false;
    const hasEmail = Boolean(user.email);
    const userLevelFcmToken = (user.fcmToken || '').toString();
    const canSendEmail = emailRemindersEnabled && hasEmail;

    const userId = (user.id || '').toString();
    if (!userId) {
      continue;
    }

    // Skip loading vehicle collections when no delivery channel is available.
    if (!canSendEmail && !userLevelFcmToken) {
      continue;
    }

    const vehicles = await queryDocuments(`users/${userId}/vehicles`);

    // Extract FCM token from the preferences doc (virtual vehicle record).
    const prefsDoc = (vehicles as any[]).find(v => v.id === 'preferences');
    const userFcmToken: string =
      userLevelFcmToken || (prefsDoc?.fcmToken || '').toString();

    for (const vehicle of vehicles as Vehicle[]) {
      // Skip the preferences sentinel – it is not a real vehicle.
      if ((vehicle as any).id === 'preferences') {
        continue;
      }

      vehiclesScanned += 1;
      const upcomingMaintenance = await resolveUpcomingMaintenance(vehicle, 30);

      if (upcomingMaintenance.length === 0) {
        continue;
      }

      if (canSendEmail) {
        try {
          await deliverReminderEmail(user.email, vehicle, upcomingMaintenance);
          remindersSent += 1;
        } catch (error) {
          reminderFailures += 1;
          logger.error('Reminder email delivery failed', {
            userId,
            email: user.email,
            vin: vehicle.vin,
            error,
          });
        }
      }

      if (userFcmToken) {
        try {
          await deliverPushNotification(
            userFcmToken,
            vehicle,
            upcomingMaintenance
          );
          pushSent += 1;
        } catch (pushError) {
          pushFailures += 1;
          logger.warn('Push notification delivery failed', {
            userId,
            vin: vehicle.vin,
            pushError,
          });
        }
      }
    }
  }

  return {
    usersScanned,
    vehiclesScanned,
    remindersSent,
    reminderFailures,
    pushSent,
    pushFailures,
  };
}

/**
 * Helper function to get upcoming maintenance items for a vehicle
 * @param {Vehicle} vehicle The vehicle to check for upcoming maintenance
 * @param {number} daysAhead Number of days to look ahead for maintenance
 * @return {Promise<MaintenanceItem[]>} Array of upcoming maintenance items
 */
async function getUpcomingMaintenance(
  vehicle: Vehicle,
  daysAhead = 30
): Promise<MaintenanceItem[]> {
  // Get maintenance entries using FirestoreCrudHelpers
  const maintenanceEntries = await FirestoreCrudHelpers.queryDocuments(
    `users/${vehicle.uid || 'unknown'}/vehicles/${vehicle.vin}/maintenance`
  );

  return deriveUpcomingMaintenanceItems(maintenanceEntries, daysAhead);
}

/**
 * Build upcoming maintenance reminders from maintenance history entries.
 * @param {MaintenanceEntry[]} maintenanceEntries User maintenance history
 * @param {number} daysAhead Number of days to look ahead for reminders
 * @return {MaintenanceItem[]} Array of upcoming maintenance items
 */
export function deriveUpcomingMaintenanceItems(
  maintenanceEntries: MaintenanceEntry[],
  daysAhead = 30
): MaintenanceItem[] {
  // This is a simplified version - in practice, you'd need manufacturer
  // schedules. For now, we'll check existing maintenance entries and look
  // for patterns
  const upcomingItems: MaintenanceItem[] = [];
  const now = new Date();
  const normalizedDaysAhead = Math.max(1, daysAhead);

  // Simple logic: if no maintenance in last 6 months, suggest oil change
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 6);

  let hasRecentOilChange = false;
  maintenanceEntries.forEach((entry: MaintenanceEntry) => {
    let entryDate: Date;
    if (entry.date instanceof Date) {
      entryDate = entry.date;
    } else if (typeof entry.date === 'string') {
      entryDate = new Date(entry.date);
    } else if (entry.date && typeof entry.date.toDate === 'function') {
      entryDate = entry.date.toDate();
    } else {
      return; // Skip invalid dates
    }

    if (
      entry.title?.toLowerCase().includes('oil') &&
      entryDate > sixMonthsAgo
    ) {
      hasRecentOilChange = true;
    }
  });

  if (!hasRecentOilChange) {
    const dueDateLabel =
      normalizedDaysAhead <= 30
        ? `Within ${normalizedDaysAhead} days`
        : 'Within 1 month';

    upcomingItems.push({
      title: 'Oil Change',
      dueDate: dueDateLabel,
      type: 'preventive',
    });
  }

  return upcomingItems;
}

/**
 * Helper function to send reminder email (placeholder)
 * @param {string} email The recipient email address
 * @param {Vehicle} vehicle The vehicle information
 * @param {MaintenanceItem[]} maintenanceItems Array of maintenance items due
 */
async function sendReminderEmail(
  email: string,
  vehicle: Vehicle,
  maintenanceItems: MaintenanceItem[]
): Promise<void> {
  const emailContent = {
    to: email,
    subject:
      `Maintenance Reminder: ${vehicle.make} ` +
      `${vehicle.model} (${vehicle.year})`,
    html: `
        <h2>Vehicle Maintenance Reminder</h2>
        <p>Your
        <strong>${vehicle.year} ${vehicle.make} ${vehicle.model}</strong>
        (VIN: ${vehicle.vin}) is due for maintenance:</p>
        <ul>
          ${maintenanceItems
            .map(
              item =>
                `<li><strong>${item.title}</strong> - Due: ${item.dueDate}</li>`
            )
            .join('')}
        </ul>
        <p>
        Please schedule these services soon to keep your vehicle in
        optimal condition.
        </p>
        <br>
        <p>Vehicle Vitals Team</p>
      `,
    text: `
      Vehicle Maintenance Reminder

      Your ${vehicle.year} ${vehicle.make} ${vehicle.model}
      (VIN: ${vehicle.vin}) is due for maintenance:

      ${maintenanceItems
        .map(item => `- ${item.title} - Due: ${item.dueDate}`)
        .join('\n')}

      Please schedule these services soon to keep your vehicle in
      optimal condition.

      Vehicle Vitals Team
    `,
  };

  await sendEmail(emailContent);
}

/**
 * Send an FCM push notification for upcoming maintenance items.
 * @param {string} fcmToken The recipient's Firebase Cloud Messaging token
 * @param {Vehicle} vehicle The vehicle with upcoming maintenance
 * @param {MaintenanceItem[]} maintenanceItems Items due for service
 * @return {Promise<void>}
 */
async function sendPushNotification(
  fcmToken: string,
  vehicle: Vehicle,
  maintenanceItems: MaintenanceItem[]
): Promise<void> {
  const firstItem = maintenanceItems[0];
  const title = [
    'Maintenance due:',
    String(vehicle.year),
    vehicle.make,
    vehicle.model,
  ].join(' ');
  const body =
    maintenanceItems.length === 1
      ? `${firstItem.title} — Due: ${firstItem.dueDate}`
      : `${firstItem.title} and ` +
        `${maintenanceItems.length - 1} more service(s) due`;

  await admin.messaging().send({
    token: fcmToken,
    notification: { title, body },
    data: {
      vin: vehicle.vin,
      type: 'maintenance_reminder',
    },
  });
}

// API roadmap scaffolds for cross-platform integrations.
// These handlers provide stable contracts while provider
// integrations are built.

export const getOwnerManuals = onRequest(
  { cors: true },
  async (request, response) => {
    try {
      if (!enforceRateLimit(request, response, 'getOwnerManuals')) {
        return;
      }

      const uid = await requireAuthenticatedUser(request, response);
      if (!uid) return;

      if (request.method !== 'GET') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
      }

      const vin = ((request.query.vin as string) || '').trim().toUpperCase();
      if (!vin || vin.length !== 17) {
        response.status(400).json({ error: 'Valid 17-character VIN required' });
        return;
      }

      const config = getIntegrationConfig();
      if (!config.features.manualsEnabled) {
        response.status(503).json({
          success: false,
          error: 'Owner manual feature is disabled',
          provider: config.providers.manuals,
          vin,
          manuals: [],
        });
        return;
      }

      if (config.providers.manuals !== 'manuals_primary') {
        response.status(501).json({
          success: false,
          error: 'Owner manual provider integration not implemented',
          provider: config.providers.manuals,
          vin,
          manuals: [],
        });
        return;
      }

      const cachedManuals = await readIntegrationCache<unknown[]>(
        uid,
        vin,
        'manuals'
      );
      if (cachedManuals.hit && Array.isArray(cachedManuals.value)) {
        response.json({
          success: true,
          provider: config.providers.manuals,
          vin,
          manuals: cachedManuals.value,
          cache: { hit: true },
        });
        return;
      }

      const manuals = await lookupOwnerManuals(vin);
      await writeIntegrationCache(uid, vin, 'manuals', manuals);
      response.json({
        success: true,
        provider: config.providers.manuals,
        vin,
        manuals,
        cache: { hit: false },
      });
    } catch (error) {
      logger.error('Owner manual lookup error:', error);
      response.status(500).json({
        success: false,
        error: 'Failed to fetch owner manuals',
      });
    }
  }
);

export const getWarrantySummary = onRequest(
  { cors: true },
  async (request, response) => {
    try {
      if (!enforceRateLimit(request, response, 'getWarrantySummary')) {
        return;
      }

      const uid = await requireAuthenticatedUser(request, response);
      if (!uid) return;

      if (request.method !== 'GET') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
      }

      const vin = ((request.query.vin as string) || '').trim().toUpperCase();
      if (!vin || vin.length !== 17) {
        response.status(400).json({ error: 'Valid 17-character VIN required' });
        return;
      }

      const mileageRaw = Number(request.query.currentMileage ?? '');
      const currentMileage = Number.isFinite(mileageRaw)
        ? mileageRaw
        : undefined;

      const config = getIntegrationConfig();
      if (!config.features.warrantyEnabled) {
        response.status(503).json({
          success: false,
          error: 'Warranty feature is disabled',
          provider: config.providers.warranty,
          vin,
          warranty: null,
        });
        return;
      }

      if (config.providers.warranty !== 'warranty_primary') {
        response.status(501).json({
          success: false,
          error: 'Warranty provider integration not implemented',
          provider: config.providers.warranty,
          vin,
          warranty: null,
        });
        return;
      }

      const cachedWarranty = await readIntegrationCache<unknown>(
        uid,
        vin,
        'warranty'
      );
      if (cachedWarranty.hit && cachedWarranty.value) {
        response.json({
          success: true,
          provider: config.providers.warranty,
          vin,
          warranty: cachedWarranty.value,
          cache: { hit: true },
        });
        return;
      }

      const warranty = await lookupWarrantySummary(vin, currentMileage);
      await writeIntegrationCache(uid, vin, 'warranty', warranty);
      response.json({
        success: true,
        provider: config.providers.warranty,
        vin,
        warranty,
        cache: { hit: false },
      });
    } catch (error) {
      logger.error('Warranty summary error:', error);
      response.status(500).json({
        success: false,
        error: 'Failed to fetch warranty summary',
      });
    }
  }
);

export const getMaintenancePlan = onRequest(
  { cors: true },
  async (request, response) => {
    try {
      if (!enforceRateLimit(request, response, 'getMaintenancePlan')) {
        return;
      }

      const uid = await requireAuthenticatedUser(request, response);
      if (!uid) return;

      if (request.method !== 'GET') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
      }

      const vin = ((request.query.vin as string) || '').trim().toUpperCase();
      const currentMileage = Number(request.query.currentMileage ?? '');

      if (!vin || vin.length !== 17) {
        response.status(400).json({ error: 'Valid 17-character VIN required' });
        return;
      }

      if (!Number.isFinite(currentMileage) || currentMileage < 0) {
        response
          .status(400)
          .json({ error: 'Valid currentMileage is required' });
        return;
      }

      const config = getIntegrationConfig();
      if (!config.features.maintenancePlanEnabled) {
        response.status(503).json({
          success: false,
          error: 'Maintenance plan feature is disabled',
          provider: config.providers.schedule,
          vin,
          plan: null,
        });
        return;
      }

      if (config.providers.schedule !== 'schedule_primary') {
        response.status(501).json({
          success: false,
          error: 'Maintenance schedule provider integration not implemented',
          provider: config.providers.schedule,
          vin,
          plan: null,
        });
        return;
      }

      const plan = buildMaintenancePlan(currentMileage);
      response.json({
        success: true,
        provider: config.providers.schedule,
        vin,
        plan,
      });
    } catch (error) {
      logger.error('Maintenance plan error:', error);
      response.status(500).json({
        success: false,
        error: 'Failed to build maintenance plan',
      });
    }
  }
);

export const createCalendarEvent = onRequest(
  { cors: true },
  async (request, response) => {
    try {
      if (!enforceRateLimit(request, response, 'createCalendarEvent')) {
        return;
      }

      const uid = await requireAuthenticatedUser(request, response);
      if (!uid) return;

      if (request.method !== 'POST') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
      }
      response.json(buildCalendarEventResponse(request.body));
    } catch (error) {
      if (error instanceof HttpsError) {
        const codeToStatus: Record<string, number> = {
          'invalid-argument': 400,
          unauthenticated: 401,
          'failed-precondition': 503,
          unimplemented: 501,
        };
        const status = codeToStatus[error.code] || 500;
        response.status(status).json({ success: false, error: error.message });
        return;
      }

      logger.error('Calendar event error:', error);
      response.status(500).json({
        success: false,
        error: 'Failed to create calendar event',
      });
    }
  }
);

/**
 * Shared calendar event creation contract used by HTTP and callable triggers.
 * @param {unknown} input Raw request payload
 * @return {object} Success payload with normalized event data
 */
function buildCalendarEventResponse(input: unknown) {
  const { vehicleVin, title, startAt, target, description, endAt } =
    (input as {
      vehicleVin?: string;
      title?: string;
      startAt?: string;
      target?: 'google' | 'apple' | 'ics';
      description?: string;
      endAt?: string;
    }) ?? {};

  const vin = (vehicleVin || '').toString().trim().toUpperCase();
  const allowedTargets = new Set(['google', 'apple', 'ics']);

  if (!vin) {
    throw new HttpsError('invalid-argument', 'vehicleVin is required');
  }

  if (!title || !startAt || !target || !allowedTargets.has(target)) {
    throw new HttpsError(
      'invalid-argument',
      'Required fields: title, startAt, target (google|apple|ics)'
    );
  }

  const config = getIntegrationConfig();
  if (!config.features.calendarEnabled) {
    throw new HttpsError('failed-precondition', 'Calendar feature is disabled');
  }

  if (config.providers.calendar !== 'calendar_primary') {
    throw new HttpsError(
      'unimplemented',
      'Calendar provider integration not implemented'
    );
  }

  const eventInput = {
    vehicleVin: vin,
    title,
    description,
    startAt,
    endAt,
    target,
  };

  const event =
    target === 'google'
      ? buildGoogleCalendarEvent(eventInput)
      : target === 'apple'
        ? buildAppleCalendarEvent(eventInput)
        : buildIcsEvent(eventInput);

  return {
    success: true,
    provider: config.providers.calendar,
    vehicleVin: vin,
    event: {
      target,
      ...event,
    },
  };
}

export const createCalendarEventCallable = onCall(async request => {
  const authRequired =
    (process.env.INTEGRATION_AUTH_REQUIRED || 'true').trim().toLowerCase() !==
    'false';

  if (authRequired && !request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  try {
    return buildCalendarEventResponse(request.data);
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    logger.error('Callable calendar event error:', error);
    throw new HttpsError('internal', 'Failed to create calendar event');
  }
});

export const verifyPremiumPurchase = onCall(async request => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  const {
    productId,
    purchaseId,
    verificationData,
    source,
    idempotencyKey,
    orgId: requestedOrgId,
  } = (request.data as {
    productId?: string;
    purchaseId?: string;
    verificationData?: string;
    source?: string;
    idempotencyKey?: string;
    orgId?: string;
  }) ?? {};

  if (productId !== 'premium_ad_free') {
    throw new HttpsError('invalid-argument', 'Unsupported premium productId');
  }

  const receipt = (verificationData || '').trim();
  if (!receipt) {
    throw new HttpsError(
      'invalid-argument',
      'verificationData is required for premium verification'
    );
  }

  const receiptHash = createHash('sha256').update(receipt).digest('hex');
  const purchaseSource = (source || 'unknown').toString();
  const orgId = (requestedOrgId || '').toString().trim();

  const reservation = await reserveIdempotencyKey({
    uid,
    operation: 'verifyPremiumPurchase',
    idempotencyKey,
  });
  if (reservation.isReplay) {
    return reservation.result;
  }

  try {
    const verification = await verifyBillingPurchase({
      productId,
      source: purchaseSource,
      receipt,
    });

    const strictVerification =
      (process.env.PREMIUM_VERIFICATION_REQUIRED || 'false')
        .trim()
        .toLowerCase() === 'true';

    if (strictVerification && !verification.verified) {
      throw new HttpsError(
        'failed-precondition',
        verification.reason ||
          'Premium receipt verification failed in strict verification mode'
      );
    }

    const db = admin.firestore();
    const receiptRef = db.doc(`premiumReceipts/${receiptHash}`);
    const entitlementRef = db.doc(`users/${uid}/entitlements/premium`);

    await db.runTransaction(async tx => {
      const receiptSnap = await tx.get(receiptRef);
      if (receiptSnap.exists) {
        const existingUid = (receiptSnap.data()?.uid || '').toString();
        if (existingUid && existingUid !== uid) {
          throw new HttpsError(
            'permission-denied',
            'Receipt is already linked to another account'
          );
        }
      }

      tx.set(
        receiptRef,
        {
          uid,
          productId,
          source: purchaseSource,
          purchaseId: (purchaseId || '').toString(),
          receiptHash,
          verified: verification.verified,
          verificationState: verification.verificationState,
          verificationProvider: verification.provider,
          verificationReason: (verification.reason || '').toString(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      tx.set(
        entitlementRef,
        {
          active: true,
          productId,
          source: purchaseSource,
          purchaseId: (purchaseId || '').toString(),
          receiptHash,
          verificationState: verification.verificationState,
          verified: verification.verified,
          verificationProvider: verification.provider,
          verificationReason: (verification.reason || '').toString(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    const ensuredOrgId = orgId || (await ensurePersonalOrganization(uid));
    await writeAuditEvent({
      orgId: ensuredOrgId,
      actorUid: uid,
      action: 'billing.verify_premium_purchase',
      targetType: 'entitlement',
      targetId: 'premium',
      details: {
        productId,
        source: purchaseSource,
        verificationState: verification.verificationState,
      },
    });

    const result = {
      success: true,
      entitlement: {
        premium: true,
        verified: verification.verified,
        verificationState: verification.verificationState,
      },
    };

    await completeIdempotencyKey(
      reservation,
      result as unknown as Record<string, unknown>
    );

    return result;
  } catch (error) {
    await markIdempotencyFailed(
      reservation,
      error instanceof Error ? error.message : 'unknown_error'
    );
    throw error;
  }
});

export const getPremiumEntitlement = onCall(async request => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  const entitlementSnap = await admin
    .firestore()
    .doc(`users/${uid}/entitlements/premium`)
    .get();

  const data = entitlementSnap.data() || {};
  return {
    success: true,
    entitlement: {
      premium: data.active === true,
      verified: data.verified === true,
      verificationState: (data.verificationState || 'none').toString(),
      productId: (data.productId || '').toString(),
      updatedAt: data.updatedAt || null,
    },
  };
});

export const bootstrapEnterpriseContextCallable = onCall(async request => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  const orgId = await ensurePersonalOrganization(
    uid,
    (request.auth?.token?.email || '').toString()
  );
  const entitlements = await resolveEffectiveEntitlements(uid, orgId);
  const orgSnap = await admin.firestore().doc(`orgs/${orgId}`).get();
  const orgData = orgSnap.data() || {};

  await writeAuditEvent({
    orgId,
    actorUid: uid,
    action: 'enterprise.bootstrap_context',
    targetType: 'organization',
    targetId: orgId,
  });

  return {
    success: true,
    orgId,
    orgType: (orgData.type || 'personal').toString(),
    garageStorageMode: normalizeGarageStorageMode(orgData.garageStorageMode),
    entitlements,
  };
});

export const getEffectiveEntitlementsCallable = onCall(async request => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  const requestedOrgId = (request.data?.orgId || '').toString().trim();
  if (!requestedOrgId) {
    await ensurePersonalOrganization(
      uid,
      (request.auth?.token?.email || '').toString()
    );
  }

  const entitlements = await resolveEffectiveEntitlements(uid, requestedOrgId);
  return {
    success: true,
    entitlements,
  };
});

export const promotePersonalGarageToHouseholdCallable = onCall(
  async request => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Missing auth context');
    }

    const orgId = await ensurePersonalOrganization(
      uid,
      (request.auth?.token?.email || '').toString()
    );
    await requireOrgRole(uid, orgId, ['org_owner']);

    const householdName = (request.data?.householdName || '').toString().trim();
    const requestedMode = normalizeGarageStorageMode(
      request.data?.garageStorageMode || 'dual_write'
    );
    const idempotencyKey = (request.data?.idempotencyKey || '').toString();

    const reservation = await reserveIdempotencyKey({
      uid,
      operation: 'promotePersonalGarageToHousehold',
      idempotencyKey,
    });
    if (reservation.isReplay) {
      return reservation.result;
    }

    try {
      const orgRef = admin.firestore().doc(`orgs/${orgId}`);
      const orgSnap = await orgRef.get();
      if (!orgSnap.exists) {
        throw new HttpsError('not-found', 'Organization not found');
      }

      const orgData = orgSnap.data() || {};
      const nextName =
        householdName ||
        (orgData.name || '').toString().trim() ||
        'Household Garage';

      await orgRef.set(
        {
          name: nextName,
          type: 'household',
          garageStorageMode: requestedMode,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // The client's vehicle list switches to reading orgs/{orgId}/vehicles
      // as soon as garageStorageMode is org_scoped/dual_write — without
      // copying existing vehicles over now, a newly promoted household
      // would show an empty garage until every vehicle was individually
      // rewritten.
      let vehiclesCopied = 0;
      if (requestedMode === 'org_scoped' || requestedMode === 'dual_write') {
        vehiclesCopied = await copyUserVehiclesIntoOrg({ uid, orgId });
      }

      await writeAuditEvent({
        orgId,
        actorUid: uid,
        action: 'organization.promote_to_household',
        targetType: 'organization',
        targetId: orgId,
        details: {
          previousType: (orgData.type || 'personal').toString(),
          garageStorageMode: requestedMode,
          householdName: nextName,
          vehiclesCopied,
        },
      });

      const entitlements = await resolveEffectiveEntitlements(uid, orgId);
      const result = {
        success: true,
        orgId,
        orgType: 'household',
        garageStorageMode: requestedMode,
        name: nextName,
        vehiclesCopied,
        entitlements,
      };

      await completeIdempotencyKey(
        reservation,
        result as unknown as Record<string, unknown>
      );

      return result;
    } catch (error) {
      await markIdempotencyFailed(
        reservation,
        error instanceof Error ? error.message : 'unknown_error'
      );
      throw error;
    }
  }
);

export const setGarageStorageModeCallable = onCall(async request => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  const requestedOrgId = (request.data?.orgId || '').toString().trim();
  const orgId = requestedOrgId || (await getPrimaryOrgIdForUser(uid));
  const garageStorageMode = normalizeGarageStorageMode(
    request.data?.garageStorageMode
  );
  const idempotencyKey = (request.data?.idempotencyKey || '').toString();

  await requireOrgRole(uid, orgId, ['org_owner']);

  const reservation = await reserveIdempotencyKey({
    uid,
    operation: 'setGarageStorageMode',
    idempotencyKey,
  });
  if (reservation.isReplay) {
    return reservation.result;
  }

  try {
    const orgRef = admin.firestore().doc(`orgs/${orgId}`);
    const orgSnap = await orgRef.get();
    if (!orgSnap.exists) {
      throw new HttpsError('not-found', 'Organization not found');
    }

    const previousMode = normalizeGarageStorageMode(
      orgSnap.data()?.garageStorageMode
    );

    await orgRef.set(
      {
        garageStorageMode,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await writeAuditEvent({
      orgId,
      actorUid: uid,
      action: 'organization.set_garage_storage_mode',
      targetType: 'organization',
      targetId: orgId,
      details: {
        previousMode,
        garageStorageMode,
      },
    });

    const result = {
      success: true,
      orgId,
      garageStorageMode,
    };

    await completeIdempotencyKey(
      reservation,
      result as unknown as Record<string, unknown>
    );

    return result;
  } catch (error) {
    await markIdempotencyFailed(
      reservation,
      error instanceof Error ? error.message : 'unknown_error'
    );
    throw error;
  }
});

export const changeSubscriptionTierCallable = onCall(async request => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  const requestedTierRaw = (request.data?.targetTier || '').toString().trim();
  if (!requestedTierRaw) {
    throw new HttpsError('invalid-argument', 'targetTier is required');
  }

  const requestedTier = normalizeTier(requestedTierRaw);
  if (requestedTierRaw !== requestedTier && requestedTierRaw !== 'free') {
    throw new HttpsError('invalid-argument', 'Unsupported targetTier');
  }

  // This callable only ever downgrades to free — it performs no payment
  // verification. Upgrades to a paid tier must go through
  // createSubscriptionCheckoutSessionCallable (real Stripe Checkout) or the
  // Stripe webhook (server-verified payment).
  if (requestedTier !== 'free') {
    throw new HttpsError(
      'failed-precondition',
      'Paid tiers must be purchased through checkout'
    );
  }

  const billingPeriod =
    (request.data?.billingPeriod || '').toString().toLowerCase() === 'annual'
      ? 'annual'
      : 'monthly';
  const idempotencyKey = (request.data?.idempotencyKey || '').toString();

  const reservation = await reserveIdempotencyKey({
    uid,
    operation: 'changeSubscriptionTier',
    idempotencyKey,
  });
  if (reservation.isReplay) {
    return reservation.result;
  }

  try {
    const { previousTier, orgId, entitlements } =
      await applySubscriptionTierState({
        uid,
        targetTier: requestedTier,
        billingPeriod,
        status: 'active',
        paymentMethod: requestedTier === 'free' ? null : 'stripe',
        verificationState: 'simulated_checkout',
      });

    await writeAuditEvent({
      orgId,
      actorUid: uid,
      action: 'billing.change_subscription_tier',
      targetType: 'subscription',
      targetId: uid,
      details: {
        previousTier,
        requestedTier,
        billingPeriod,
      },
    });

    const result = {
      success: true,
      tier: requestedTier,
      entitlements,
    };

    await completeIdempotencyKey(
      reservation,
      result as unknown as Record<string, unknown>
    );

    return result;
  } catch (error) {
    await markIdempotencyFailed(
      reservation,
      error instanceof Error ? error.message : 'unknown_error'
    );
    throw error;
  }
});

export const createSubscriptionCheckoutSessionCallable = onCall(
  {
    secrets: [
      'STRIPE_SECRET_KEY',
      'STRIPE_CHECKOUT_SUCCESS_URL',
      'STRIPE_CHECKOUT_CANCEL_URL',
      'STRIPE_PRICE_ID_PRO_MONTHLY',
      'STRIPE_PRICE_ID_PRO_ANNUAL',
      'STRIPE_PRICE_ID_PREMIUM_MONTHLY',
      'STRIPE_PRICE_ID_PREMIUM_ANNUAL',
    ],
  },
  async request => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Missing auth context');
    }

    const requestedTierRaw = (request.data?.targetTier || '').toString().trim();
    const requestedTier = normalizeTier(requestedTierRaw);
    if (requestedTier !== 'pro' && requestedTier !== 'premium') {
      throw new HttpsError(
        'invalid-argument',
        'Only pro and premium can be purchased through checkout'
      );
    }

    const billingPeriod =
      (request.data?.billingPeriod || '').toString().toLowerCase() === 'annual'
        ? 'annual'
        : 'monthly';
    const idempotencyKey = (request.data?.idempotencyKey || '').toString();

    const reservation = await reserveIdempotencyKey({
      uid,
      operation: 'createSubscriptionCheckoutSession',
      idempotencyKey,
    });
    if (reservation.isReplay) {
      return reservation.result;
    }

    try {
      const checkoutTemplate = (process.env.STRIPE_CHECKOUT_URL_TEMPLATE || '')
        .toString()
        .trim();
      const stripeSecretKey = (process.env.STRIPE_SECRET_KEY || '')
        .toString()
        .trim();
      const configuredAppBaseUrl = (process.env.APP_BASE_URL || '')
        .toString()
        .trim()
        .replace(/\/$/, '');

      const successUrl =
        (process.env.STRIPE_CHECKOUT_SUCCESS_URL || '').toString().trim() ||
        (configuredAppBaseUrl
          ? `${configuredAppBaseUrl}/app/subscription?checkout=success&session_id={CHECKOUT_SESSION_ID}`
          : '');
      const cancelUrl =
        (process.env.STRIPE_CHECKOUT_CANCEL_URL || '').toString().trim() ||
        (configuredAppBaseUrl
          ? `${configuredAppBaseUrl}/app/subscription?checkout=cancelled`
          : '');

      if (stripeSecretKey) {
        if (!successUrl || !cancelUrl) {
          throw new HttpsError(
            'failed-precondition',
            'Stripe checkout URLs are not configured'
          );
        }

        const customerEmail = (request.auth?.token?.email || '')
          .toString()
          .trim();

        const stripeSession = await createStripeCheckoutSession({
          uid,
          tier: requestedTier,
          billingPeriod,
          successUrl,
          cancelUrl,
          customerEmail,
        });

        await admin
          .firestore()
          .doc(`users/${uid}/billingSessions/${stripeSession.sessionId}`)
          .set({
            sessionId: stripeSession.sessionId,
            uid,
            targetTier: requestedTier,
            billingPeriod,
            status: 'pending',
            provider: 'stripe',
            stripeCustomerId: stripeSession.customerId || null,
            stripeSubscriptionId: stripeSession.subscriptionId || null,
            checkoutUrl: stripeSession.checkoutUrl,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

        if (stripeSession.customerId) {
          await admin
            .firestore()
            .doc(`stripeCustomerLookup/${stripeSession.customerId}`)
            .set(
              {
                uid,
                stripeCustomerId: stripeSession.customerId,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
        }

        const orgId = await ensurePersonalOrganization(uid);
        await writeAuditEvent({
          orgId,
          actorUid: uid,
          action: 'billing.create_checkout_session',
          targetType: 'checkout_session',
          targetId: stripeSession.sessionId,
          details: {
            requestedTier,
            billingPeriod,
            provider: 'stripe',
          },
        });

        const stripeResult = {
          success: true,
          mode: 'redirect',
          checkoutUrl: stripeSession.checkoutUrl,
          checkoutSessionId: stripeSession.sessionId,
        };

        await completeIdempotencyKey(
          reservation,
          stripeResult as unknown as Record<string, unknown>
        );

        return stripeResult;
      }

      if (!checkoutTemplate) {
        // Fail closed: without a real Stripe secret key or an explicit test
        // checkout template configured, there is no way to verify payment.
        // Never silently activate a paid tier for free.
        throw new HttpsError(
          'failed-precondition',
          'Checkout is not configured for this environment'
        );
      }

      const sessionId = `cs_sim_${randomBytes(12).toString('hex')}`;
      const checkoutUrl = checkoutTemplate
        .replace('{CHECKOUT_SESSION_ID}', encodeURIComponent(sessionId))
        .replace('{UID}', encodeURIComponent(uid))
        .replace('{TIER}', encodeURIComponent(requestedTier))
        .replace('{BILLING_PERIOD}', encodeURIComponent(billingPeriod));

      await admin
        .firestore()
        .doc(`users/${uid}/billingSessions/${sessionId}`)
        .set({
          sessionId,
          uid,
          targetTier: requestedTier,
          billingPeriod,
          status: 'pending',
          provider: 'stripe',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      const orgId = await ensurePersonalOrganization(uid);
      await writeAuditEvent({
        orgId,
        actorUid: uid,
        action: 'billing.create_checkout_session',
        targetType: 'checkout_session',
        targetId: sessionId,
        details: {
          requestedTier,
          billingPeriod,
        },
      });

      const result = {
        success: true,
        mode: 'redirect',
        checkoutUrl,
        checkoutSessionId: sessionId,
      };

      await completeIdempotencyKey(
        reservation,
        result as unknown as Record<string, unknown>
      );

      return result;
    } catch (error) {
      await markIdempotencyFailed(
        reservation,
        error instanceof Error ? error.message : 'unknown_error'
      );
      throw error;
    }
  }
);

export const createApiAccessKeyCallable = onCall(async request => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  const entitlements = await requireFeatureEntitlement(uid, 'api_access');
  const keyLabel = (request.data?.label || 'Default key').toString().trim();
  const label = keyLabel ? keyLabel.slice(0, 80) : 'Default key';
  const idempotencyKey = (request.data?.idempotencyKey || '').toString();

  const reservation = await reserveIdempotencyKey({
    uid,
    operation: 'createApiAccessKey',
    idempotencyKey,
  });
  if (reservation.isReplay) {
    return reservation.result;
  }

  try {
    const db = admin.firestore();
    const keyId = `key_${randomBytes(8).toString('hex')}`;
    const rawKey = `vvk_${randomBytes(24).toString('hex')}`;
    const keyPrefix = rawKey.slice(0, 12);
    const keyHash = hashApiAccessKey(rawKey);

    await db.doc(`users/${uid}/apiAccessKeys/${keyId}`).set({
      keyId,
      label,
      keyPrefix,
      keyHash,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUsedAt: null,
      revokedAt: null,
    });

    await db.doc(`apiKeyLookup/${keyHash}`).set({
      uid,
      keyId,
      active: true,
      keyPrefix,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      revokedAt: null,
    });

    await writeAuditEvent({
      orgId: entitlements.orgId,
      actorUid: uid,
      action: 'integration.create_api_access_key',
      targetType: 'api_access_key',
      targetId: keyId,
      details: {
        keyPrefix,
        label,
      },
    });

    const result = {
      success: true,
      key: {
        keyId,
        label,
        keyPrefix,
      },
      rawKey,
    };

    await completeIdempotencyKey(
      reservation,
      result as unknown as Record<string, unknown>
    );

    return result;
  } catch (error) {
    await markIdempotencyFailed(
      reservation,
      error instanceof Error ? error.message : 'unknown_error'
    );
    throw error;
  }
});

export const listApiAccessKeysCallable = onCall(async request => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  await requireFeatureEntitlement(uid, 'api_access');

  const snapshot = await admin
    .firestore()
    .collection(`users/${uid}/apiAccessKeys`)
    .orderBy('createdAt', 'desc')
    .limit(25)
    .get();

  const keys = snapshot.docs.map(doc => {
    const data = doc.data() as ApiAccessKeyMetadata;
    return {
      keyId: (data.keyId || doc.id).toString(),
      label: (data.label || '').toString(),
      keyPrefix: (data.keyPrefix || '').toString(),
      active: data.active === true,
      createdAt: data.createdAt || null,
      updatedAt: data.updatedAt || null,
      lastUsedAt: data.lastUsedAt || null,
      revokedAt: data.revokedAt || null,
    };
  });

  return {
    success: true,
    keys,
  };
});

export const revokeApiAccessKeyCallable = onCall(async request => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  const entitlements = await requireFeatureEntitlement(uid, 'api_access');
  const keyId = (request.data?.keyId || '').toString().trim();
  if (!keyId) {
    throw new HttpsError('invalid-argument', 'keyId is required');
  }

  const keyRef = admin.firestore().doc(`users/${uid}/apiAccessKeys/${keyId}`);
  const keySnap = await keyRef.get();
  if (!keySnap.exists) {
    throw new HttpsError('not-found', 'API access key not found');
  }

  await keyRef.set(
    {
      active: false,
      revokedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  const keyData = keySnap.data() as ApiAccessKeyMetadata & {
    keyHash?: string;
  };
  const keyHash = (keyData?.keyHash || '').toString();
  if (keyHash) {
    await admin.firestore().doc(`apiKeyLookup/${keyHash}`).set(
      {
        active: false,
        revokedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  await writeAuditEvent({
    orgId: entitlements.orgId,
    actorUid: uid,
    action: 'integration.revoke_api_access_key',
    targetType: 'api_access_key',
    targetId: keyId,
  });

  return {
    success: true,
    keyId,
    revoked: true,
  };
});

export const getZapierWebhookConfigCallable = onCall(async request => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  await requireFeatureEntitlement(uid, 'zapier_integration');
  await requireFeatureEntitlement(uid, 'api_access');

  const baseUrl = resolveFunctionBaseUrl();
  if (!baseUrl) {
    throw new HttpsError(
      'failed-precondition',
      'Webhook base URL is not configured'
    );
  }

  const webhookSecretConfigured =
    (process.env.ZAPIER_WEBHOOK_SECRET || '').trim().length > 0;

  return {
    success: true,
    webhookUrl: `${baseUrl}/zapierMaintenanceWebhook`,
    instructions:
      'Send POST JSON with vin and title. Include your API key as x-api-key header. If signature is required, include x-vv-signature as sha256=<hmac_sha256_raw_body>.',
    requiresSignature: webhookSecretConfigured,
  };
});

export const transferVehicleCallable = onCall(async request => {
  const actorUid = request.auth?.uid;
  if (!actorUid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  const vin = (request.data?.vin || '').toString().trim();
  const idempotencyKey = (request.data?.idempotencyKey || '').toString();

  if (!vin) {
    throw new HttpsError('invalid-argument', 'vin is required');
  }

  const reservation = await reserveIdempotencyKey({
    uid: actorUid,
    operation: 'transferVehicle',
    idempotencyKey,
  });
  if (reservation.isReplay) {
    return reservation.result;
  }

  try {
    const targetUser = await resolveVehicleTransferTarget({
      recipientUid: request.data?.recipientUid,
      recipientEmail: request.data?.recipientEmail,
    });

    if (targetUser.uid === actorUid) {
      throw new HttpsError(
        'invalid-argument',
        'You cannot transfer a vehicle to your own account'
      );
    }

    const db = admin.firestore();
    const sourceVehicleRef = db.doc(`users/${actorUid}/vehicles/${vin}`);
    const targetVehicleRef = db.doc(`users/${targetUser.uid}/vehicles/${vin}`);

    const [sourceVehicleSnap, targetVehicleSnap] = await Promise.all([
      sourceVehicleRef.get(),
      targetVehicleRef.get(),
      ensurePersonalOrganization(targetUser.uid, targetUser.email || undefined),
    ]);

    if (!sourceVehicleSnap.exists) {
      throw new HttpsError('not-found', 'Vehicle was not found');
    }

    if (targetVehicleSnap.exists) {
      throw new HttpsError(
        'already-exists',
        'Recipient already has a vehicle with that ID'
      );
    }

    const sourceVehicleData = sourceVehicleSnap.data() || {};
    const batch = db.batch();
    await queueVehicleTransferOperations({
      batch,
      sourceVehicleRef,
      targetVehicleRef,
      sourceVehicleData,
      actorUid,
      recipientUid: targetUser.uid,
    });
    await batch.commit();

    const orgId = await getPrimaryOrgIdForUser(actorUid);
    await writeAuditEvent({
      orgId,
      actorUid,
      action: 'vehicle.transfer',
      targetType: 'vehicle',
      targetId: vin,
      details: {
        recipientUid: targetUser.uid,
        recipientEmail: targetUser.email,
      },
    });

    const result = {
      success: true,
      vin,
      recipientUid: targetUser.uid,
      recipientEmail: targetUser.email,
    };

    await completeIdempotencyKey(
      reservation,
      result as unknown as Record<string, unknown>
    );

    return result;
  } catch (error) {
    await markIdempotencyFailed(
      reservation,
      error instanceof Error ? error.message : 'unknown_error'
    );
    throw error;
  }
});

const ACCOUNT_CONSOLIDATION_CODE_TTL_MS = 15 * 60 * 1000;
const ACCOUNT_CONSOLIDATION_RESEND_COOLDOWN_MS = 60 * 1000;
const ACCOUNT_CONSOLIDATION_MAX_ATTEMPTS = 5;

function hashConsolidationCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

function maskEmailForDisplay(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) {
    return '***';
  }
  const visible = local.slice(0, 1);
  return `${visible}${'*'.repeat(Math.max(local.length - 1, 3))}@${domain}`;
}

// Step 1 of account consolidation: prove the caller actually controls the
// source account by emailing a one-time code to its registered address.
// Without this, any signed-in user who learned another UID could migrate
// that account's vehicles and subscription into their own (see
// consolidateAccountDataCallable below).
export const requestAccountConsolidationCallable = onCall(
  // sendEmail() reads WORKSPACE_SMTP_USER/WORKSPACE_SMTP_APP_PASSWORD when
  // EMAIL_PROVIDER=workspace; Firebase Functions v2 binds secrets
  // per-function, so this must declare them itself (same class of gap
  // fixed on stripeSubscriptionWebhook).
  {secrets: ['WORKSPACE_SMTP_USER', 'WORKSPACE_SMTP_APP_PASSWORD']},
  async request => {
  const primaryUid = request.auth?.uid;
  if (!primaryUid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  const sourceUid = (request.data?.sourceUid || '').toString().trim();
  if (!sourceUid) {
    throw new HttpsError('invalid-argument', 'sourceUid is required');
  }

  if (sourceUid === primaryUid) {
    throw new HttpsError(
      'invalid-argument',
      'Cannot consolidate account into itself'
    );
  }

  let sourceEmail = '';
  try {
    const sourceUser = await admin.auth().getUser(sourceUid);
    sourceEmail = (sourceUser.email || '').toString().trim();
  } catch (error) {
    throw new HttpsError(
      'not-found',
      `Source account uid ${sourceUid} not found`
    );
  }

  if (!sourceEmail) {
    throw new HttpsError(
      'failed-precondition',
      'Source account has no email on file; cannot verify ownership'
    );
  }

  const db = admin.firestore();
  const requestRef = db.doc(`accountConsolidationRequests/${primaryUid}`);
  const existing = await requestRef.get();
  const existingData = existing.data();
  if (existingData?.createdAtMs) {
    const elapsed = Date.now() - Number(existingData.createdAtMs);
    if (elapsed < ACCOUNT_CONSOLIDATION_RESEND_COOLDOWN_MS) {
      throw new HttpsError(
        'resource-exhausted',
        'A code was just sent — please wait before requesting another'
      );
    }
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  await requestRef.set({
    sourceUid,
    codeHash: hashConsolidationCode(code),
    attempts: 0,
    createdAtMs: Date.now(),
    expiresAt: Timestamp.fromMillis(
      Date.now() + ACCOUNT_CONSOLIDATION_CODE_TTL_MS
    ),
  });

  await sendEmail({
    to: sourceEmail,
    subject: 'Confirm account consolidation — Vehicle Vitals',
    text:
      `A Vehicle Vitals account is requesting to merge this account's ` +
      `data into it. If this was you, enter this code to confirm: ${code}\n\n` +
      `This code expires in 15 minutes. If you did not request this, ` +
      `you can safely ignore this email.`,
    html:
      `<p>A Vehicle Vitals account is requesting to merge this account's ` +
      `data into it.</p><p>If this was you, enter this code to confirm:</p>` +
      `<p style="font-size:24px;font-weight:bold;">${code}</p>` +
      `<p>This code expires in 15 minutes. If you did not request this, ` +
      `you can safely ignore this email.</p>`,
  });

  return {
    success: true,
    sentTo: maskEmailForDisplay(sourceEmail),
  };
});

const SUPPORT_REQUEST_TOPICS = [
  'Bug Report',
  'Account / Login',
  'Billing / Subscription',
  'VIN Lookup / Vehicle Data',
  'Feature Request',
  'Other',
];

const supportRequestRateState = new Map<
  string,
  {count: number; windowStartMs: number}
>();

function enforceSupportRequestRateLimit(clientKey: string): void {
  const maxRequests = 5;
  const windowMs = 60 * 60 * 1000;
  const now = Date.now();
  const current = supportRequestRateState.get(clientKey);

  if (!current || now - current.windowStartMs >= windowMs) {
    supportRequestRateState.set(clientKey, {count: 1, windowStartMs: now});
    return;
  }

  if (current.count >= maxRequests) {
    throw new HttpsError(
      'resource-exhausted',
      'Too many support requests — please wait before trying again'
    );
  }

  current.count += 1;
  supportRequestRateState.set(clientKey, current);
}

export const submitSupportRequestCallable = onCall(
  {secrets: ['WORKSPACE_SMTP_USER', 'WORKSPACE_SMTP_APP_PASSWORD']},
  async request => {
    const clientKey = request.auth?.uid || request.rawRequest?.ip || 'unknown';
    enforceSupportRequestRateLimit(clientKey);

    const name = (request.data?.name || '').toString().trim();
    const email = (request.data?.email || '').toString().trim();
    const topic = (request.data?.topic || '').toString().trim();
    const message = (request.data?.message || '').toString().trim();

    if (!name || name.length > 200) {
      throw new HttpsError('invalid-argument', 'A valid name is required');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
      throw new HttpsError('invalid-argument', 'A valid email is required');
    }

    if (!SUPPORT_REQUEST_TOPICS.includes(topic)) {
      throw new HttpsError('invalid-argument', 'A valid topic is required');
    }

    if (!message || message.length > 5000) {
      throw new HttpsError(
        'invalid-argument',
        'A message (up to 5000 characters) is required'
      );
    }

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    await sendEmail({
      to: 'support@vehicle-vitals.com',
      replyTo: email,
      subject: `[Support] ${topic} — ${name}`,
      text:
        `New support request\n\n` +
        `Name: ${name}\n` +
        `Email: ${email}\n` +
        `Topic: ${topic}\n\n` +
        `${message}`,
      html:
        `<p><strong>New support request</strong></p>` +
        `<p>Name: ${escapeHtml(name)}<br>` +
        `Email: ${escapeHtml(email)}<br>` +
        `Topic: ${escapeHtml(topic)}</p>` +
        `<p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`,
    });

    return {success: true};
  }
);

export const consolidateAccountDataCallable = onCall(async request => {
  const primaryUid = request.auth?.uid;
  if (!primaryUid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  const sourceUid = (request.data?.sourceUid || '').toString().trim();
  const idempotencyKey = (request.data?.idempotencyKey || '').toString();
  const verificationCode = (request.data?.verificationCode || '')
    .toString()
    .trim();

  if (!sourceUid) {
    throw new HttpsError('invalid-argument', 'sourceUid is required');
  }

  if (sourceUid === primaryUid) {
    throw new HttpsError(
      'invalid-argument',
      'Cannot consolidate account into itself'
    );
  }

  if (!verificationCode) {
    throw new HttpsError(
      'failed-precondition',
      'A verification code is required — request one first'
    );
  }

  const reservation = await reserveIdempotencyKey({
    uid: primaryUid,
    operation: 'consolidateAccountData',
    idempotencyKey,
  });
  if (reservation.isReplay) {
    return reservation.result;
  }

  try {
    const db = admin.firestore();

    // Verify source account exists
    try {
      await admin.auth().getUser(sourceUid);
    } catch (error) {
      throw new HttpsError(
        'not-found',
        `Source account uid ${sourceUid} not found`
      );
    }

    // Require proof of ownership: a verification code must have been
    // requested via requestAccountConsolidationCallable and emailed to the
    // source account's registered address, and match here.
    const requestRef = db.doc(`accountConsolidationRequests/${primaryUid}`);
    const requestSnap = await requestRef.get();
    const requestData = requestSnap.data();

    if (!requestSnap.exists || !requestData) {
      throw new HttpsError(
        'failed-precondition',
        'No pending verification request — request a new code'
      );
    }

    if (requestData.sourceUid !== sourceUid) {
      throw new HttpsError(
        'failed-precondition',
        'Verification request does not match this source account'
      );
    }

    const expiresAtMs =
      requestData.expiresAt instanceof Timestamp
        ? requestData.expiresAt.toMillis()
        : 0;
    if (Date.now() > expiresAtMs) {
      await requestRef.delete();
      throw new HttpsError(
        'failed-precondition',
        'Verification code expired — request a new one'
      );
    }

    if (
      Number(requestData.attempts || 0) >= ACCOUNT_CONSOLIDATION_MAX_ATTEMPTS
    ) {
      await requestRef.delete();
      throw new HttpsError(
        'failed-precondition',
        'Too many incorrect attempts — request a new code'
      );
    }

    const providedHash = hashConsolidationCode(verificationCode);
    const expectedHash = (requestData.codeHash || '').toString();
    const providedBuf = Buffer.from(providedHash, 'hex');
    const expectedBuf = Buffer.from(expectedHash, 'hex');
    const codeMatches =
      providedBuf.length === expectedBuf.length &&
      timingSafeEqual(providedBuf, expectedBuf);

    if (!codeMatches) {
      await requestRef.update({
        attempts: admin.firestore.FieldValue.increment(1),
      });
      throw new HttpsError('permission-denied', 'Incorrect verification code');
    }

    // Code verified — consume it immediately so it cannot be replayed.
    await requestRef.delete();

    // Get all vehicles from source account
    const sourceVehiclesSnap = await db
      .collection(`users/${sourceUid}/vehicles`)
      .get();

    const vehiclesToMigrate = sourceVehiclesSnap.docs
      .filter(doc => doc.id !== 'preferences')
      .map(doc => doc.id);

    if (vehiclesToMigrate.length === 0) {
      return {
        success: true,
        sourceUid,
        primaryUid,
        vehiclesMigrated: 0,
        message: 'No vehicles to migrate from source account',
      };
    }

    // Ensure primary account organization exists
    await ensurePersonalOrganization(
      primaryUid,
      (request.auth?.token?.email || '').toString()
    );

    // Migrate each vehicle
    let vehiclesMigrated = 0;
    let vehicleSkipped = 0;
    const migratedVins: string[] = [];

    for (const vin of vehiclesToMigrate) {
      try {
        const sourceVehicleRef = db.doc(`users/${sourceUid}/vehicles/${vin}`);
        const targetVehicleRef = db.doc(`users/${primaryUid}/vehicles/${vin}`);

        const [sourceVehicleSnap, targetVehicleSnap] = await Promise.all([
          sourceVehicleRef.get(),
          targetVehicleRef.get(),
        ]);

        if (!sourceVehicleSnap.exists) {
          vehicleSkipped += 1;
          continue;
        }

        // Skip if vehicle already exists in target
        if (targetVehicleSnap.exists) {
          vehicleSkipped += 1;
          continue;
        }

        const sourceVehicleData = sourceVehicleSnap.data() || {};
        const batch = db.batch();

        await queueVehicleTransferOperations({
          batch,
          sourceVehicleRef,
          targetVehicleRef,
          sourceVehicleData,
          actorUid: sourceUid,
          recipientUid: primaryUid,
        });

        await batch.commit();
        vehiclesMigrated += 1;
        migratedVins.push(vin);
      } catch (vinError) {
        logger.warn('Failed to migrate vehicle during consolidation', {
          sourceUid,
          primaryUid,
          vin,
          error: vinError,
        });
        vehicleSkipped += 1;
      }
    }

    // Migrate subscription tier if source has a higher tier
    const sourceSubscriptionSnap = await db
      .doc(`users/${sourceUid}/subscription/current`)
      .get();
    const primarySubscriptionSnap = await db
      .doc(`users/${primaryUid}/subscription/current`)
      .get();

    const sourceTier = normalizeTier(sourceSubscriptionSnap.data()?.tier);
    const primaryTier = normalizeTier(primarySubscriptionSnap.data()?.tier);

    if (tierRank(sourceTier) > tierRank(primaryTier)) {
      const sourceSubData = sourceSubscriptionSnap.data() || {};
      await db.doc(`users/${primaryUid}/subscription/current`).set(
        {
          tier: sourceTier,
          status: sourceSubData.status || 'active',
          autoRenew: sourceSubData.autoRenew !== false,
          migratedFrom: sourceUid,
          migratedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    // Migrate premium entitlements if source is premium
    const sourcePremiumSnap = await db
      .doc(`users/${sourceUid}/entitlements/premium`)
      .get();
    const primaryPremiumSnap = await db
      .doc(`users/${primaryUid}/entitlements/premium`)
      .get();

    const sourcePremiumActive = sourcePremiumSnap.data()?.active === true;
    const primaryPremiumActive = primaryPremiumSnap.data()?.active === true;

    if (sourcePremiumActive && !primaryPremiumActive) {
      const sourcePremiumData = sourcePremiumSnap.data() || {};
      await db.doc(`users/${primaryUid}/entitlements/premium`).set(
        {
          active: true,
          verified: sourcePremiumData.verified || false,
          verificationState: sourcePremiumData.verificationState || 'migrated',
          migratedFrom: sourceUid,
          migratedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    const orgId = await getPrimaryOrgIdForUser(primaryUid);
    await writeAuditEvent({
      orgId,
      actorUid: primaryUid,
      action: 'account.consolidate_data',
      targetType: 'user_account',
      targetId: sourceUid,
      details: {
        vehiclesMigrated,
        vehicleSkipped,
        migratedVins,
        sourceTierMigrated: sourceTier !== primaryTier ? sourceTier : null,
        premiumMigrated: sourcePremiumActive && !primaryPremiumActive,
      },
    });

    const result = {
      success: true,
      sourceUid,
      primaryUid,
      vehiclesMigrated,
      vehicleSkipped,
      migratedVins,
      message: `Successfully migrated ${vehiclesMigrated} vehicle(s) from source account`,
    };

    await completeIdempotencyKey(
      reservation,
      result as unknown as Record<string, unknown>
    );

    return result;
  } catch (error) {
    await markIdempotencyFailed(
      reservation,
      error instanceof Error ? error.message : 'unknown_error'
    );
    throw error;
  }
});

export const zapierMaintenanceWebhook = onRequest(
  { cors: true },
  async (request, response) => {
    try {
      if (!enforceRateLimit(request, response, 'zapierMaintenanceWebhook')) {
        return;
      }

      if (request.method !== 'POST') {
        response
          .status(405)
          .json({ success: false, error: 'Method not allowed' });
        return;
      }

      const apiKeyHeader =
        (request.headers['x-api-key'] || '').toString().trim() ||
        (request.headers.authorization || '')
          .toString()
          .replace(/^Bearer\s+/i, '')
          .trim();

      if (!apiKeyHeader) {
        response.status(401).json({ success: false, error: 'Missing API key' });
        return;
      }

      const webhookSecret = (process.env.ZAPIER_WEBHOOK_SECRET || '').trim();
      if (webhookSecret && !isWebhookSignatureValid(request, webhookSecret)) {
        response
          .status(401)
          .json({ success: false, error: 'Invalid webhook signature' });
        return;
      }

      const keyHash = hashApiAccessKey(apiKeyHeader);
      const lookupSnap = await admin
        .firestore()
        .doc(`apiKeyLookup/${keyHash}`)
        .get();

      if (!lookupSnap.exists) {
        response.status(401).json({ success: false, error: 'Invalid API key' });
        return;
      }

      const lookupData = lookupSnap.data() || {};
      if (lookupData.active !== true) {
        response.status(401).json({ success: false, error: 'Invalid API key' });
        return;
      }

      const uid = (lookupData.uid || '').toString().trim();
      const keyId = (lookupData.keyId || '').toString().trim();
      if (!uid) {
        response
          .status(401)
          .json({ success: false, error: 'Invalid API key owner' });
        return;
      }

      const keyDocRef = admin
        .firestore()
        .doc(`users/${uid}/apiAccessKeys/${keyId}`);
      const keyDoc = await keyDocRef.get();
      const keyData = keyDoc.data() || {};
      if (
        !keyDoc.exists ||
        keyData.active !== true ||
        keyData.keyHash !== keyHash
      ) {
        response.status(401).json({ success: false, error: 'Invalid API key' });
        return;
      }

      const entitlements = await resolveEffectiveEntitlements(uid);
      if (
        !entitlements.features?.api_access ||
        !entitlements.features?.zapier_integration
      ) {
        response.status(403).json({
          success: false,
          error: 'Plan does not allow webhook integrations',
        });
        return;
      }

      const vin = ((request.body?.vin || '') as string)
        .toString()
        .trim()
        .toUpperCase();
      const title = ((request.body?.title || '') as string).toString().trim();
      const description = ((request.body?.description || '') as string)
        .toString()
        .trim();
      const serviceType = ((request.body?.serviceType || '') as string)
        .toString()
        .trim();
      const frequency = (
        (request.body?.frequency || 'Webhook trigger') as string
      )
        .toString()
        .trim();
      const interval = Math.max(1, Number(request.body?.interval || 1));
      const nextDueMileage = Number(request.body?.nextDueMileage || 0);
      const milesUntilDue = Number(request.body?.milesUntilDue || 0);

      if (!vin || !title) {
        response.status(400).json({
          success: false,
          error: 'vin and title are required',
        });
        return;
      }

      const vehicleCollectionRoot = await resolveVehicleCollectionRoot(uid);
      const vehicleRef = admin
        .firestore()
        .doc(`${vehicleCollectionRoot}/${vin}`);
      const vehicleSnap = await vehicleRef.get();
      if (!vehicleSnap.exists) {
        response.status(404).json({
          success: false,
          error: 'Vehicle not found for API key owner',
        });
        return;
      }

      const reminderRef = await admin
        .firestore()
        .collection(`${vehicleCollectionRoot}/${vin}/reminders`)
        .add({
          title,
          description,
          serviceType: serviceType || null,
          frequency,
          interval,
          nextDueMileage: Number.isFinite(nextDueMileage) ? nextDueMileage : 0,
          milesUntilDue: Number.isFinite(milesUntilDue) ? milesUntilDue : 0,
          status: 'active',
          source: 'zapier_webhook',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      await keyDocRef.set(
        {
          lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      await lookupSnap.ref.set(
        {
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      response.status(200).json({
        success: true,
        uid,
        vin,
        reminderId: reminderRef.id,
      });
    } catch (error) {
      logger.error('Zapier webhook processing failed', error);
      response
        .status(500)
        .json({ success: false, error: 'Failed to process webhook' });
    }
  }
);

export const stripeSubscriptionWebhook = onRequest(
  {
    cors: true,
    secrets: [
      'STRIPE_WEBHOOK_SECRET',
      // resolveSubscriptionTierFromStripeObject falls back to a price-ID
      // lookup (getStripePriceLookup) when the event object has no
      // metadata.targetTier/tier — e.g. invoice.payment_succeeded events,
      // which don't reliably carry the subscription's metadata. Firebase
      // Functions v2 binds secrets per-function, so these must be declared
      // here too, not just on createSubscriptionCheckoutSessionCallable.
      'STRIPE_PRICE_ID_PRO_MONTHLY',
      'STRIPE_PRICE_ID_PRO_ANNUAL',
      'STRIPE_PRICE_ID_PREMIUM_MONTHLY',
      'STRIPE_PRICE_ID_PREMIUM_ANNUAL',
    ],
  },
  async (request, response) => {
    try {
      if (!enforceRateLimit(request, response, 'stripeSubscriptionWebhook')) {
        return;
      }

      if (request.method !== 'POST') {
        response
          .status(405)
          .json({ success: false, error: 'Method not allowed' });
        return;
      }

      // Fail closed: a missing/misconfigured secret must never be treated
      // as "signature verification not required" — this is a public,
      // unauthenticated endpoint.
      const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();
      if (
        !webhookSecret ||
        !isStripeWebhookSignatureValid(request, webhookSecret)
      ) {
        response
          .status(401)
          .json({ success: false, error: 'Invalid signature' });
        return;
      }

      const event =
        request.body && typeof request.body === 'object'
          ? request.body
          : JSON.parse(getRequestBodyBuffer(request).toString('utf8') || '{}');

      const eventId = (event?.id || '').toString().trim();
      const eventType = (event?.type || '').toString().trim();
      const eventObject = event?.data?.object || {};

      if (!eventId || !eventType) {
        response
          .status(400)
          .json({ success: false, error: 'Invalid event payload' });
        return;
      }

      const eventRef = admin.firestore().doc(`billingWebhookEvents/${eventId}`);
      const eventSnap = await eventRef.get();
      if (eventSnap.exists) {
        response
          .status(200)
          .json({ success: true, deduplicated: true, eventId });
        return;
      }

      const uid = await resolveUidFromStripeObject(eventObject);
      if (!uid) {
        response.status(400).json({
          success: false,
          error: 'Missing user mapping for Stripe event',
        });
        return;
      }

      const stripeCustomerId = (eventObject?.customer || '').toString().trim();
      const stripeSubscriptionId = (
        eventObject?.subscription ||
        eventObject?.id ||
        ''
      )
        .toString()
        .trim();

      if (stripeCustomerId) {
        await admin
          .firestore()
          .doc(`stripeCustomerLookup/${stripeCustomerId}`)
          .set(
            {
              uid,
              stripeCustomerId,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
      }

      let reconciliationResult: Record<string, unknown> = {
        eventType,
        uid,
        handled: false,
      };

      if (
        eventType === 'checkout.session.completed' ||
        eventType === 'customer.subscription.updated' ||
        eventType === 'invoice.payment_succeeded'
      ) {
        const tier = resolveSubscriptionTierFromStripeObject(eventObject);
        if (tier === 'pro' || tier === 'premium') {
          const billingPeriod =
            resolveBillingPeriodFromStripeObject(eventObject);
          const subscriptionStatus =
            resolveSubscriptionStatusFromStripeObject(eventObject);
          const applied = await applySubscriptionTierState({
            uid,
            targetTier: tier,
            billingPeriod,
            status: subscriptionStatus,
            paymentMethod: 'stripe',
            stripeCustomerId,
            stripeSubscriptionId,
            lastPaymentError: null,
            verificationState: 'webhook_verified',
          });

          reconciliationResult = {
            eventType,
            uid,
            handled: true,
            tier,
            billingPeriod,
            status: subscriptionStatus,
            orgId: applied.orgId,
          };
        }
      }

      if (eventType === 'invoice.payment_failed') {
        await admin
          .firestore()
          .doc(`users/${uid}/subscription/current`)
          .set(
            {
              status: 'past_due',
              paymentMethod: 'stripe',
              stripeCustomerId: stripeCustomerId || null,
              stripeSubscriptionId: stripeSubscriptionId || null,
              lastPaymentError: 'stripe_invoice_payment_failed',
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

        reconciliationResult = {
          eventType,
          uid,
          handled: true,
          status: 'past_due',
        };
      }

      if (eventType === 'customer.subscription.deleted') {
        const periodEnd =
          toTimestampFromUnixSeconds(eventObject?.current_period_end) ||
          Timestamp.now();

        await admin
          .firestore()
          .doc(`users/${uid}/subscription/current`)
          .set(
            {
              tier: 'free',
              status: 'canceled',
              autoRenew: false,
              paymentMethod: 'stripe',
              stripeCustomerId: stripeCustomerId || null,
              stripeSubscriptionId: stripeSubscriptionId || null,
              currentPeriodEnd: periodEnd,
              renewalDate: periodEnd,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

        await admin.firestore().doc(`users/${uid}/entitlements/premium`).set(
          {
            active: false,
            verified: false,
            verificationState: 'revoked_by_webhook_cancellation',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        reconciliationResult = {
          eventType,
          uid,
          handled: true,
          status: 'canceled',
        };
      }

      if (eventType === 'charge.dispute.created') {
        await admin
          .firestore()
          .doc(`users/${uid}/subscription/current`)
          .set(
            {
              status: 'past_due',
              paymentMethod: 'stripe',
              stripeCustomerId: stripeCustomerId || null,
              stripeSubscriptionId: stripeSubscriptionId || null,
              lastPaymentError: 'stripe_charge_dispute',
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

        reconciliationResult = {
          eventType,
          uid,
          handled: true,
          status: 'past_due',
          reason: 'dispute_created',
        };
      }

      if (eventType === 'charge.refunded') {
        await admin
          .firestore()
          .doc(`users/${uid}/subscription/current`)
          .set(
            {
              status: 'past_due',
              paymentMethod: 'stripe',
              stripeCustomerId: stripeCustomerId || null,
              stripeSubscriptionId: stripeSubscriptionId || null,
              lastPaymentError: 'stripe_charge_refunded',
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

        reconciliationResult = {
          eventType,
          uid,
          handled: true,
          status: 'past_due',
          reason: 'charge_refunded',
        };
      }

      await eventRef.set({
        eventId,
        eventType,
        uid,
        reconciliationResult,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      response.status(200).json({
        success: true,
        eventId,
        ...reconciliationResult,
      });
    } catch (error) {
      logger.error('Stripe webhook processing failed', error);
      response
        .status(500)
        .json({ success: false, error: 'Failed to process billing webhook' });
    }
  }
);

export const getOrganizationMembersCallable = onCall(async request => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  const requestedOrgId = (request.data?.orgId || '').toString().trim();
  const orgId = requestedOrgId || (await getPrimaryOrgIdForUser(uid));

  await requireOrgRole(uid, orgId, [
    'org_owner',
    'org_admin',
    'support_agent',
    'billing_admin',
    'read_only',
  ]);

  const membersSnap = await admin
    .firestore()
    .collection(`orgs/${orgId}/members`)
    .get();

  const members = membersSnap.docs.map(doc => ({
    uid: doc.id,
    ...doc.data(),
  }));

  return {
    success: true,
    orgId,
    members,
  };
});

export const setOrganizationMemberRoleCallable = onCall(async request => {
  const actorUid = request.auth?.uid;
  if (!actorUid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  const orgId = (request.data?.orgId || '').toString().trim();
  const targetUid = (request.data?.targetUid || '').toString().trim();
  const newRole = toOrgRole(request.data?.role);
  const idempotencyKey = (request.data?.idempotencyKey || '').toString();

  if (!orgId || !targetUid) {
    throw new HttpsError(
      'invalid-argument',
      'orgId and targetUid are required'
    );
  }

  await requireOrgRole(actorUid, orgId, ['org_owner', 'org_admin']);

  const reservation = await reserveIdempotencyKey({
    uid: actorUid,
    operation: 'setOrganizationMemberRole',
    idempotencyKey,
  });
  if (reservation.isReplay) {
    return reservation.result;
  }

  try {
    const memberRef = admin
      .firestore()
      .doc(`orgs/${orgId}/members/${targetUid}`);
    const memberSnap = await memberRef.get();
    if (!memberSnap.exists) {
      throw new HttpsError('not-found', 'Organization member not found');
    }

    await memberRef.set(
      {
        role: newRole,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await admin
      .firestore()
      .doc(`users/${targetUid}/orgMemberships/${orgId}`)
      .set(
        {
          orgId,
          role: newRole,
          status: 'active',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    await writeAuditEvent({
      orgId,
      actorUid,
      action: 'organization.set_member_role',
      targetType: 'member',
      targetId: targetUid,
      details: { role: newRole },
    });

    const result = {
      success: true,
      orgId,
      targetUid,
      role: newRole,
    };
    await completeIdempotencyKey(
      reservation,
      result as unknown as Record<string, unknown>
    );

    return result;
  } catch (error) {
    await markIdempotencyFailed(
      reservation,
      error instanceof Error ? error.message : 'unknown_error'
    );
    throw error;
  }
});

export const createInvoiceDraftCallable = onCall(async request => {
  const actorUid = request.auth?.uid;
  if (!actorUid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  const payload = (request.data || {}) as InvoiceDraftInput;
  const orgId = (payload.orgId || '').toString().trim();
  const customerName = (payload.customerName || '').toString().trim();
  const dueDate = (payload.dueDate || '').toString().trim();
  const issueDate = (payload.issueDate || '').toString().trim();
  const currency = (payload.currency || 'USD').toString().trim().toUpperCase();
  const notes = (payload.notes || '').toString().trim();
  const lineItems = Array.isArray(payload.lineItems)
    ? payload.lineItems
        .map(item => ({
          description: (item?.description || '').toString().trim(),
          quantity: normalizeMoneyAmount(item?.quantity ?? 0),
          unitPrice: normalizeMoneyAmount(item?.unitPrice ?? 0),
        }))
        .filter(item => item.description)
    : [];
  const idempotencyKey = (request.data?.idempotencyKey || '').toString();

  if (!orgId || !customerName || !dueDate) {
    throw new HttpsError(
      'invalid-argument',
      'orgId, customerName, and dueDate are required'
    );
  }

  await requireOrgRole(actorUid, orgId, [
    'org_owner',
    'org_admin',
    'billing_admin',
  ]);

  const amountDue =
    payload.amountDue != null
      ? normalizeMoneyAmount(payload.amountDue)
      : Math.round(
          lineItems.reduce(
            (sum, item) => sum + item.quantity * item.unitPrice,
            0
          ) * 100
        ) / 100;

  const reservation = await reserveIdempotencyKey({
    uid: actorUid,
    operation: 'createInvoiceDraft',
    idempotencyKey,
  });
  if (reservation.isReplay) {
    return reservation.result;
  }

  try {
    const invoiceRef = admin
      .firestore()
      .collection(`orgs/${orgId}/financeInvoices`)
      .doc();

    await invoiceRef.set({
      orgId,
      customerName,
      issueDate: issueDate || new Date().toISOString().slice(0, 10),
      dueDate,
      currency,
      amountDue,
      amountPaid: 0,
      status: 'draft',
      notes,
      lineItems,
      createdByUid: actorUid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await writeAuditEvent({
      orgId,
      actorUid,
      action: 'finance.create_invoice_draft',
      targetType: 'invoice',
      targetId: invoiceRef.id,
      details: {
        customerName,
        dueDate,
        currency,
        amountDue,
      },
    });

    const result = {
      success: true,
      orgId,
      invoiceId: invoiceRef.id,
      status: 'draft',
    };

    await completeIdempotencyKey(
      reservation,
      result as unknown as Record<string, unknown>
    );

    return result;
  } catch (error) {
    await markIdempotencyFailed(
      reservation,
      error instanceof Error ? error.message : 'unknown_error'
    );
    throw error;
  }
});

export const createPayableDraftCallable = onCall(async request => {
  const actorUid = request.auth?.uid;
  if (!actorUid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  const payload = (request.data || {}) as PayableDraftInput;
  const orgId = (payload.orgId || '').toString().trim();
  const vendorName = (payload.vendorName || '').toString().trim();
  const dueDate = (payload.dueDate || '').toString().trim();
  const billDate = (payload.billDate || '').toString().trim();
  const currency = (payload.currency || 'USD').toString().trim().toUpperCase();
  const category = (payload.category || '').toString().trim();
  const notes = (payload.notes || '').toString().trim();
  const amountDue = normalizeMoneyAmount(payload.amountDue ?? 0);
  const idempotencyKey = (request.data?.idempotencyKey || '').toString();

  if (!orgId || !vendorName || !dueDate) {
    throw new HttpsError(
      'invalid-argument',
      'orgId, vendorName, and dueDate are required'
    );
  }

  await requireOrgRole(actorUid, orgId, [
    'org_owner',
    'org_admin',
    'billing_admin',
  ]);

  const reservation = await reserveIdempotencyKey({
    uid: actorUid,
    operation: 'createPayableDraft',
    idempotencyKey,
  });
  if (reservation.isReplay) {
    return reservation.result;
  }

  try {
    const payableRef = admin
      .firestore()
      .collection(`orgs/${orgId}/financePayables`)
      .doc();

    await payableRef.set({
      orgId,
      vendorName,
      billDate: billDate || new Date().toISOString().slice(0, 10),
      dueDate,
      currency,
      amountDue,
      amountPaid: 0,
      status: 'draft',
      category,
      notes,
      createdByUid: actorUid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await writeAuditEvent({
      orgId,
      actorUid,
      action: 'finance.create_payable_draft',
      targetType: 'payable',
      targetId: payableRef.id,
      details: {
        vendorName,
        dueDate,
        currency,
        amountDue,
      },
    });

    const result = {
      success: true,
      orgId,
      payableId: payableRef.id,
      status: 'draft',
    };

    await completeIdempotencyKey(
      reservation,
      result as unknown as Record<string, unknown>
    );

    return result;
  } catch (error) {
    await markIdempotencyFailed(
      reservation,
      error instanceof Error ? error.message : 'unknown_error'
    );
    throw error;
  }
});

export const requestUserDataExportCallable = onCall(async request => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  const idempotencyKey = (request.data?.idempotencyKey || '').toString();
  const reservation = await reserveIdempotencyKey({
    uid,
    operation: 'requestUserDataExport',
    idempotencyKey,
  });
  if (reservation.isReplay) {
    return reservation.result;
  }

  try {
    const requestRef = await admin
      .firestore()
      .collection('complianceRequests')
      .add({
        uid,
        type: 'export',
        status: 'requested',
        piiTags: [
          'email',
          'vehicle_data',
          'maintenance_history',
          'subscription',
        ],
        requestedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    const result = {
      success: true,
      requestId: requestRef.id,
      status: 'requested',
    };

    await completeIdempotencyKey(
      reservation,
      result as unknown as Record<string, unknown>
    );

    return result;
  } catch (error) {
    await markIdempotencyFailed(
      reservation,
      error instanceof Error ? error.message : 'unknown_error'
    );
    throw error;
  }
});

export const requestUserDataDeletionCallable = onCall(async request => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  const idempotencyKey = (request.data?.idempotencyKey || '').toString();
  const reservation = await reserveIdempotencyKey({
    uid,
    operation: 'requestUserDataDeletion',
    idempotencyKey,
  });
  if (reservation.isReplay) {
    return reservation.result;
  }

  try {
    const requestRef = await admin
      .firestore()
      .collection('complianceRequests')
      .add({
        uid,
        type: 'deletion',
        status: 'requested',
        piiTags: [
          'email',
          'vehicle_data',
          'maintenance_history',
          'subscription',
        ],
        requestedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    const result = {
      success: true,
      requestId: requestRef.id,
      status: 'requested',
    };

    await completeIdempotencyKey(
      reservation,
      result as unknown as Record<string, unknown>
    );

    return result;
  } catch (error) {
    await markIdempotencyFailed(
      reservation,
      error instanceof Error ? error.message : 'unknown_error'
    );
    throw error;
  }
});

export const applyRetentionPolicyCallable = onCall(async request => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  requireSuperAdmin(request);

  const orgId = (request.data?.orgId || '').toString().trim();
  const retentionDaysRaw = Number(request.data?.retentionDays || 365);
  const idempotencyKey = (request.data?.idempotencyKey || '').toString();

  if (!orgId) {
    throw new HttpsError('invalid-argument', 'orgId is required');
  }

  const retentionDays = Number.isFinite(retentionDaysRaw)
    ? Math.max(30, Math.min(3650, Math.floor(retentionDaysRaw)))
    : 365;

  const reservation = await reserveIdempotencyKey({
    uid,
    operation: 'applyRetentionPolicy',
    idempotencyKey,
  });
  if (reservation.isReplay) {
    return reservation.result;
  }

  try {
    await admin.firestore().doc(`orgs/${orgId}/compliance/retention`).set(
      {
        retentionDays,
        updatedByUid: uid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await writeAuditEvent({
      orgId,
      actorUid: uid,
      action: 'compliance.apply_retention_policy',
      targetType: 'retention_policy',
      targetId: orgId,
      details: { retentionDays },
    });

    const result = {
      success: true,
      orgId,
      retentionDays,
    };

    await completeIdempotencyKey(
      reservation,
      result as unknown as Record<string, unknown>
    );

    return result;
  } catch (error) {
    await markIdempotencyFailed(
      reservation,
      error instanceof Error ? error.message : 'unknown_error'
    );
    throw error;
  }
});

export const recordSupportActionCallable = onCall(async request => {
  const actorUid = request.auth?.uid;
  if (!actorUid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  requireSuperAdmin(request);

  const orgId = (request.data?.orgId || '').toString().trim();
  const targetUid = (request.data?.targetUid || '').toString().trim();
  const action = (request.data?.action || '').toString().trim();
  const notes = (request.data?.notes || '').toString().trim();
  const idempotencyKey = (request.data?.idempotencyKey || '').toString();

  if (!orgId || !targetUid || !action) {
    throw new HttpsError(
      'invalid-argument',
      'orgId, targetUid, and action are required'
    );
  }

  const reservation = await reserveIdempotencyKey({
    uid: actorUid,
    operation: 'recordSupportAction',
    idempotencyKey,
  });
  if (reservation.isReplay) {
    return reservation.result;
  }

  try {
    await writeAuditEvent({
      orgId,
      actorUid,
      action: `support.${action}`,
      targetType: 'user',
      targetId: targetUid,
      details: { notes },
    });

    const result = {
      success: true,
      orgId,
      targetUid,
      action,
    };

    await completeIdempotencyKey(
      reservation,
      result as unknown as Record<string, unknown>
    );

    return result;
  } catch (error) {
    await markIdempotencyFailed(
      reservation,
      error instanceof Error ? error.message : 'unknown_error'
    );
    throw error;
  }
});

export const getSupportAccessContextCallable = onCall(async request => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Missing auth context');
  }

  const access = getSupportAccessContext(request);
  return {
    success: true,
    ...access,
  };
});

export const searchSupportUsersCallable = onCall(async request => {
  requireSuperAdmin(request);

  const rawQuery =
    typeof request.data?.query === 'string' ? request.data.query : '';
  const query = rawQuery.trim().toLowerCase();
  const rawLimit = Number(request.data?.limit || 12);
  const limit = Number.isFinite(rawLimit)
    ? Math.max(1, Math.min(25, Math.floor(rawLimit)))
    : 12;

  const auth = admin.auth();
  const results: SupportUserSummary[] = [];
  let pageToken: string | undefined;

  do {
    const page = await auth.listUsers(1000, pageToken);

    for (const userRecord of page.users) {
      if (results.length >= limit) {
        break;
      }

      const haystack = [
        userRecord.uid,
        userRecord.email,
        userRecord.displayName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (query && !haystack.includes(query)) {
        continue;
      }

      results.push(await buildSupportUserSummary(userRecord));
    }

    pageToken = page.pageToken || undefined;
  } while (pageToken && results.length < limit);

  return {
    success: true,
    query,
    results,
  };
});
