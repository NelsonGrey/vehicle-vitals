#!/usr/bin/env node

/*
  Backfill personal organizations and org memberships for existing users.

  Usage:
    node scripts/backfill-personal-org-memberships.js           # dry run
    node scripts/backfill-personal-org-memberships.js --apply   # write changes

  Requirements:
    - Firebase credentials via GOOGLE_APPLICATION_CREDENTIALS,
      firebase login:ci runtime, or workload identity.
*/

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const APPLY = process.argv.includes('--apply');

function personalOrgId(uid) {
  return `personal_${uid}`;
}

async function* iterateUsers(pageSize = 1000) {
  let nextPageToken;

  do {
    const page = await admin.auth().listUsers(pageSize, nextPageToken);
    for (const userRecord of page.users) {
      yield userRecord;
    }

    nextPageToken = page.pageToken;
  } while (nextPageToken);
}

async function collectBackfillPlan() {
  const plan = [];

  for await (const userRecord of iterateUsers()) {
    const uid = userRecord.uid;
    const email = (userRecord.email || '').toString();
    const orgId = personalOrgId(uid);

    const [orgSnap, memberSnap, userMembershipSnap] = await Promise.all([
      db.doc(`orgs/${orgId}`).get(),
      db.doc(`orgs/${orgId}/members/${uid}`).get(),
      db.doc(`users/${uid}/orgMemberships/${orgId}`).get(),
    ]);

    const needsOrg = !orgSnap.exists;
    const needsMember = !memberSnap.exists;
    const needsUserMembership = !userMembershipSnap.exists;

    if (!needsOrg && !needsMember && !needsUserMembership) {
      continue;
    }

    plan.push({
      uid,
      email,
      orgId,
      needsOrg,
      needsMember,
      needsUserMembership,
    });
  }

  return plan;
}

async function applyBackfillPlan(plan) {
  let batch = db.batch();
  let ops = 0;
  let writes = 0;

  const flush = async () => {
    if (ops === 0) {
      return;
    }

    await batch.commit();
    writes += ops;
    batch = db.batch();
    ops = 0;
  };

  for (const item of plan) {
    const { uid, email, orgId, needsOrg, needsMember, needsUserMembership } =
      item;

    if (needsOrg) {
      batch.set(
        db.doc(`orgs/${orgId}`),
        {
          orgId,
          name: `Personal Garage (${uid.slice(0, 6)})`,
          type: 'personal',
          planTier: 'free',
          createdByUid: uid,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      ops += 1;
    }

    if (needsMember) {
      batch.set(
        db.doc(`orgs/${orgId}/members/${uid}`),
        {
          uid,
          email,
          role: 'org_owner',
          status: 'active',
          joinedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      ops += 1;
    }

    if (needsUserMembership) {
      batch.set(
        db.doc(`users/${uid}/orgMemberships/${orgId}`),
        {
          orgId,
          role: 'org_owner',
          status: 'active',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      ops += 1;
    }

    if (ops >= 450) {
      await flush();
    }
  }

  await flush();
  return writes;
}

async function main() {
  console.log(
    `[backfill-personal-org-memberships] mode=${APPLY ? 'apply' : 'dry-run'}`
  );

  const plan = await collectBackfillPlan();

  if (plan.length === 0) {
    console.log('[backfill-personal-org-memberships] no changes required');
    return;
  }

  const summary = plan.reduce(
    (acc, item) => {
      if (item.needsOrg) acc.orgs += 1;
      if (item.needsMember) acc.members += 1;
      if (item.needsUserMembership) acc.userMemberships += 1;
      return acc;
    },
    { orgs: 0, members: 0, userMemberships: 0 }
  );

  console.log(
    '[backfill-personal-org-memberships] planned changes:',
    JSON.stringify(
      {
        usersAffected: plan.length,
        orgDocsToCreate: summary.orgs,
        memberDocsToCreate: summary.members,
        userMembershipDocsToCreate: summary.userMemberships,
      },
      null,
      2
    )
  );

  if (!APPLY) {
    console.log(
      '[backfill-personal-org-memberships] dry run complete; pass --apply to write changes'
    );
    return;
  }

  const writes = await applyBackfillPlan(plan);
  console.log(`[backfill-personal-org-memberships] completed writes=${writes}`);
}

main().catch(error => {
  console.error('[backfill-personal-org-memberships] failed', error);
  process.exitCode = 1;
});
