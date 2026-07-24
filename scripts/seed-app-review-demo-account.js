#!/usr/bin/env node

/*
  Create (or refresh) the Apple App Review demo account in production:
  Firebase Auth user + a personal org pre-set to the Premium tier + a
  realistic garage (vehicles, maintenance, reminders, preferences) so a
  reviewer signing in sees a fully populated app with no setup required.

  Usage:
    node scripts/seed-app-review-demo-account.js           # dry run
    node scripts/seed-app-review-demo-account.js --apply    # write changes

  Always targets vehicle-vitals-prod explicitly (hardcoded below) —
  this script has exactly one purpose and must never accidentally seed
  dev/staging by inheriting whatever project happens to be active.

  Requirements:
    - gcloud/firebase credentials with owner (or at least Auth + Firestore
      admin) access to vehicle-vitals-prod, via Application Default
      Credentials (gcloud auth application-default login).

  Rotation: safe to re-run. If the account already exists, its password
  is reset to a newly generated one and its data is rewritten to this
  script's fixtures (Firestore writes use deterministic doc IDs, so
  re-running does not create duplicates).
*/

const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const crypto = require('crypto');

const PROJECT_ID = 'vehicle-vitals-prod';
const DEMO_EMAIL = 'apple-review-demo@vehicle-vitals.com';
const DEMO_DISPLAY_NAME = 'Apple Review Demo';
const APPLY = process.argv.includes('--apply');

function generatePassword(length = 20) {
  const charset =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#%^&*-_=+';
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += charset[bytes[i] % charset.length];
  }
  return out;
}

function personalOrgId(uid) {
  return `personal_${uid}`;
}

function isoDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function isoDaysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function emptyDocumentPortfolio() {
  const categories = [
    {
      key: 'ownership',
      title: 'Ownership',
      items: [
        { id: 'title', title: 'Title' },
        { id: 'registration', title: 'Registration' },
        { id: 'insurance', title: 'Insurance' },
        { id: 'bill_of_sale', title: 'Bill of Sale' },
      ],
    },
    {
      key: 'finance',
      title: 'Finance',
      items: [
        { id: 'loan_or_lease', title: 'Loan or Lease' },
        { id: 'payment_history', title: 'Payment History' },
        { id: 'tax_receipts', title: 'Tax Receipts' },
      ],
    },
    {
      key: 'maintenance',
      title: 'Maintenance',
      items: [
        { id: 'service_history', title: 'Service History' },
        { id: 'repair_invoices', title: 'Repair Invoices' },
        { id: 'warranty_records', title: 'Warranty Records' },
        { id: 'inspection_reports', title: 'Inspection Reports' },
      ],
    },
    {
      key: 'reference',
      title: 'Reference',
      items: [
        { id: 'owners_manual', title: "Owner's Manual" },
        { id: 'accident_reports', title: 'Accident Reports' },
        { id: 'photo_log', title: 'Photo Log' },
        { id: 'modifications', title: 'Modifications' },
      ],
    },
  ];

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    categories: categories.map((category) => ({
      key: category.key,
      title: category.title,
      items: category.items.map((item) => ({
        id: item.id,
        title: item.title,
        description: '',
        required: false,
        status: 'missing',
        files: [],
        notes: '',
        updatedAt: null,
      })),
    })),
  };
}

const VEHICLES = [
  {
    vin: '1HGCV1F13LA123456',
    make: 'Honda',
    model: 'Accord',
    year: 2020,
    mileage: 34210,
    vehicleStatus: 'active',
    purchaseDate: isoDaysAgo(900),
    maintenance: [
      {
        title: 'Oil and Filter Change',
        notes: 'Synthetic blend, replaced cabin air filter too.',
        mileage: '32000',
        cost: 64.99,
        performedBy: 'repair_shop',
        providerName: 'Austin Auto Care',
        coverage: 'parts_and_labor',
        date: isoDaysAgo(120),
      },
      {
        title: 'Tire Rotation and Balance',
        notes: '',
        mileage: '28500',
        cost: 39.0,
        performedBy: 'repair_shop',
        providerName: 'Austin Auto Care',
        coverage: 'labor_only',
        date: isoDaysAgo(240),
      },
      {
        title: 'Front Brake Pads Replacement',
        notes: 'Pads and rotors, squealing noise resolved.',
        mileage: '25000',
        cost: 310.5,
        performedBy: 'dealership',
        providerName: 'Honda of Austin',
        coverage: 'parts_and_labor',
        date: isoDaysAgo(420),
      },
    ],
    reminders: [
      {
        title: 'Oil Change Due',
        description: 'Every 5,000 miles or 6 months.',
        serviceType: 'oil_change',
        status: 'active',
        nextDueMileage: 37000,
        milesUntilDue: 2790,
      },
      {
        title: 'Annual State Inspection',
        description: 'Due before registration renewal.',
        serviceType: 'inspection',
        status: 'active',
        nextDueMileage: 36000,
        milesUntilDue: 1790,
      },
    ],
  },
  {
    vin: '1FTEW1EP4KFA23457',
    make: 'Ford',
    model: 'F-150',
    year: 2019,
    mileage: 61840,
    vehicleStatus: 'active',
    purchaseDate: isoDaysAgo(1500),
    maintenance: [
      {
        title: 'Full Synthetic Oil Change',
        notes: '',
        mileage: '60000',
        cost: 89.99,
        performedBy: 'repair_shop',
        providerName: 'QuickLube Express',
        coverage: 'parts_and_labor',
        date: isoDaysAgo(90),
      },
      {
        title: 'Transmission Fluid Service',
        notes: 'Preventive service per manufacturer schedule.',
        mileage: '55000',
        cost: 225.0,
        performedBy: 'dealership',
        providerName: 'Round Rock Ford',
        coverage: 'parts_and_labor',
        date: isoDaysAgo(300),
      },
    ],
    reminders: [
      {
        title: 'Tire Rotation Due',
        description: 'Every 6,000 miles.',
        serviceType: 'tire_rotation',
        status: 'active',
        nextDueMileage: 66000,
        milesUntilDue: 4160,
      },
    ],
  },
  {
    vin: '5YJ3E1EA4NF123458',
    make: 'Tesla',
    model: 'Model 3',
    year: 2022,
    mileage: 18120,
    vehicleStatus: 'active',
    purchaseDate: isoDaysAgo(600),
    maintenance: [
      {
        title: 'Cabin Air Filter Replacement',
        notes: '',
        mileage: '15000',
        cost: 45.0,
        performedBy: 'self',
        providerName: '',
        coverage: 'parts_only',
        date: isoDaysAgo(150),
      },
      {
        title: 'Tire Rotation',
        notes: 'Rotated at recommended interval, tread wear even.',
        mileage: '10000',
        cost: 30.0,
        performedBy: 'repair_shop',
        providerName: 'Discount Tire',
        coverage: 'labor_only',
        date: isoDaysAgo(330),
      },
    ],
    reminders: [
      {
        title: 'Tire Rotation Due',
        description: 'Every 6,250 miles per manufacturer guidance.',
        serviceType: 'tire_rotation',
        status: 'active',
        nextDueMileage: 22500,
        milesUntilDue: 4380,
      },
    ],
  },
];

async function main() {
  console.log(
    `[seed-app-review-demo-account] mode=${APPLY ? 'apply' : 'dry-run'} project=${PROJECT_ID}`
  );

  if (!APPLY) {
    console.log(
      `[seed-app-review-demo-account] would create/update Auth user ${DEMO_EMAIL}`
    );
    console.log(
      `[seed-app-review-demo-account] would write personal org (planTier=premium), subscription, entitlements, preferences, and ${VEHICLES.length} vehicles (${VEHICLES.reduce((n, v) => n + v.maintenance.length, 0)} maintenance records, ${VEHICLES.reduce((n, v) => n + v.reminders.length, 0)} reminders)`
    );
    console.log(
      '[seed-app-review-demo-account] dry run complete; pass --apply to write changes'
    );
    return;
  }

  admin.initializeApp({
    credential: admin.applicationDefault(),
    projectId: PROJECT_ID,
  });

  const auth = getAuth();
  const db = getFirestore();
  const password = generatePassword();

  let uid;
  try {
    const existing = await auth.getUserByEmail(DEMO_EMAIL);
    uid = existing.uid;
    await auth.updateUser(uid, {
      password,
      emailVerified: true,
      displayName: DEMO_DISPLAY_NAME,
      disabled: false,
    });
    console.log(`[seed-app-review-demo-account] reset existing user uid=${uid}`);
  } catch (error) {
    if (error.code !== 'auth/user-not-found') throw error;
    const created = await auth.createUser({
      email: DEMO_EMAIL,
      password,
      emailVerified: true,
      displayName: DEMO_DISPLAY_NAME,
    });
    uid = created.uid;
    console.log(`[seed-app-review-demo-account] created new user uid=${uid}`);
  }

  await auth.setCustomUserClaims(uid, { demo_account: true });

  const orgId = personalOrgId(uid);
  const now = FieldValue.serverTimestamp();
  const batch = db.batch();

  batch.set(
    db.doc(`orgs/${orgId}`),
    {
      orgId,
      name: 'Apple Review Demo Garage',
      type: 'personal',
      garageStorageMode: 'user_scoped',
      planTier: 'premium',
      createdByUid: uid,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true }
  );

  batch.set(
    db.doc(`orgs/${orgId}/members/${uid}`),
    {
      uid,
      email: DEMO_EMAIL,
      role: 'org_owner',
      status: 'active',
      joinedAt: now,
      updatedAt: now,
    },
    { merge: true }
  );

  batch.set(
    db.doc(`users/${uid}/orgMemberships/${orgId}`),
    {
      orgId,
      role: 'org_owner',
      status: 'active',
      updatedAt: now,
    },
    { merge: true }
  );

  batch.set(
    db.doc(`users/${uid}`),
    {
      displayName: DEMO_DISPLAY_NAME,
      preferredName: 'Apple Review',
      role: 'demo',
      email: DEMO_EMAIL,
      emailRemindersEnabled: false,
      updatedAt: now,
      createdFrom: 'scripts/seed-app-review-demo-account.js',
    },
    { merge: true }
  );

  batch.set(
    db.doc(`users/${uid}/subscription/current`),
    {
      tier: 'premium',
      status: 'active',
      currentPeriodStart: Timestamp.fromDate(
        new Date(isoDaysAgo(30))
      ),
      currentPeriodEnd: Timestamp.fromDate(
        new Date(isoDaysFromNow(335))
      ),
      renewalDate: Timestamp.fromDate(
        new Date(isoDaysFromNow(335))
      ),
      autoRenew: true,
      paymentMethod: 'app_store',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      lastPaymentError: null,
      updatedAt: now,
    },
    { merge: true }
  );

  batch.set(
    db.doc(`users/${uid}/entitlements/premium`),
    {
      active: true,
      tier: 'premium',
      billingPeriod: 'annual',
      productId: 'PREMIUM_iOS_ANNUAL',
      source: 'app_store',
      purchaseId: `demo-seed-${uid}`,
      receiptHash: 'demo-seed-noop',
      verificationState: 'verified',
      verified: true,
      verificationProvider: 'admin-seed',
      verificationReason:
        'Provisioned for Apple App Review, submission 6282ef3d-7122-4c29-ae08-110af9624fd0',
      updatedAt: now,
    },
    { merge: true }
  );

  batch.set(
    db.doc(`users/${uid}/vehicles/preferences`),
    {
      homeAddress: {
        street1: '500 Congress Ave',
        street2: '',
        city: 'Austin',
        stateProvince: 'TX',
        postalCode: '78701',
        country: 'US',
      },
      preferredProviderRadiusMiles: 25,
      preferredProviderType: 'all',
      preferredProviderUseVehicleMake: false,
      preferredVehicleMake: null,
      emailRemindersEnabled: false,
      reminderLeadDays: 14,
      preferredReminderTimingDays: 14,
      preferredDailyMiles: 30,
      notificationEmail: null,
      fcmToken: null,
      updatedAt: now,
    },
    { merge: true }
  );

  await batch.commit();
  console.log(
    `[seed-app-review-demo-account] wrote org/profile/subscription/entitlements/preferences for uid=${uid}`
  );

  for (const vehicle of VEHICLES) {
    const vehicleRef = db.doc(`users/${uid}/vehicles/${vehicle.vin}`);
    await vehicleRef.set(
      {
        vin: vehicle.vin,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        mileage: vehicle.mileage,
        vehicleStatus: vehicle.vehicleStatus,
        purchaseDate: vehicle.purchaseDate,
        documentPortfolio: emptyDocumentPortfolio(),
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    const vehicleBatch = db.batch();
    // Deterministic IDs (not auto-IDs) so re-running this script -- e.g. to
    // rotate the password -- overwrites the same fixture docs instead of
    // appending a fresh duplicate set on top every time.
    vehicle.maintenance.forEach((entry, index) => {
      const ref = vehicleRef.collection('maintenance').doc(`demo-seed-${index}`);
      vehicleBatch.set(ref, {
        title: entry.title,
        notes: entry.notes,
        mileage: entry.mileage,
        cost: entry.cost,
        performedBy: entry.performedBy,
        providerName: entry.providerName,
        coverage: entry.coverage,
        date: Timestamp.fromDate(new Date(entry.date)),
        createdAt: now,
        updatedAt: now,
      });
    });
    vehicle.reminders.forEach((reminder, index) => {
      const ref = vehicleRef.collection('reminders').doc(`demo-seed-${index}`);
      vehicleBatch.set(ref, {
        title: reminder.title,
        description: reminder.description,
        serviceType: reminder.serviceType,
        status: reminder.status,
        nextDueMileage: reminder.nextDueMileage,
        milesUntilDue: reminder.milesUntilDue,
        vin: vehicle.vin,
        createdAt: now,
        updatedAt: now,
      });
    });
    await vehicleBatch.commit();
    console.log(
      `[seed-app-review-demo-account] wrote vehicle ${vehicle.vin} (${vehicle.year} ${vehicle.make} ${vehicle.model}) with ${vehicle.maintenance.length} maintenance + ${vehicle.reminders.length} reminders`
    );
  }

  console.log('');
  console.log('=== App Store Connect review credentials ===');
  console.log(`Email:    ${DEMO_EMAIL}`);
  console.log(`Password: ${password}`);
  console.log('=============================================');
  console.log(
    '[seed-app-review-demo-account] save the password now — it is not stored anywhere and re-running this script will rotate it.'
  );
}

main().catch((error) => {
  console.error('[seed-app-review-demo-account] failed', error);
  process.exitCode = 1;
});
