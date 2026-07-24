# Household & Light-Fleet Implementation Plan

> **Status (July 20, 2026):** Plan/status history. Some shared-garage foundation
> has shipped, but this document is not current release proof. Functions paths
> refer to the private companion repository mounted at `packages/functions`.
> Use `REQUIREMENTS.md` for the current delivery classification.

Gap-closing plan for the `households` and `light-fleets` personas defined in
[PRODUCT_DESIGN.md](./PRODUCT_DESIGN.md). Cross-referenced against
[REQUIREMENTS.md](./REQUIREMENTS.md), [BUSINESS_REQUIREMENTS.md](./BUSINESS_REQUIREMENTS.md),
and the org/member callables in `packages/functions/src/index.ts`.

## What's actually shipped today

All org/household plumbing lives in `packages/functions/src/index.ts` and
`firebase/firestore.rules`. No fleet-specific code exists anywhere in the
codebase — REQUIREMENTS.md's Feature Traceability Baseline is explicit:
*"Fleet manager workflows | Not Implemented | Not Ready | Roadmap only."*

| Capability | Callable | Notes |
| --- | --- | --- |
| Personal org bootstrap | `bootstrapEnterpriseContextCallable` | Every user gets an org of `type: 'personal'` on first touch. |
| Promote to household | `promotePersonalGarageToHouseholdCallable` | Org-owner only. Renames org, sets `garageStorageMode`, copies existing vehicles in. **Web UI shipped** (Profile -> Shared Garage, see below). |
| Change storage mode | `setGarageStorageModeCallable` | Org-owner only. Switches `user_scoped` / `dual_write` / `org_scoped`. |
| List members | `getOrganizationMembersCallable` | Any member can list `orgs/{orgId}/members`. |
| Change a member's role | `setOrganizationMemberRoleCallable` | Org-owner/admin only. Assigns one of 5 fixed roles. |
| Effective entitlements | `getEffectiveEntitlementsCallable` | Resolves tier/feature flags for an org. |
| Compliance export/deletion | `requestUserDataExportCallable`, `requestUserDataDeletionCallable` | Generic GDPR/CCPA-style request lifecycle, not fleet-specific reporting. |

**The 5 fixed roles** (`OrgRole` in `index.ts`): `org_owner`, `org_admin`,
`billing_admin`, `support_agent`, `read_only`. No `driver` or `fleet_manager`
role exists anywhere in `packages/shared`, `packages/functions`, or
`firestore.rules`.

**Confirmed missing (not partially built — absent):**
- **Member invites.** There is no callable to add a new member to an org —
  only list existing members and change an existing member's role. A
  household literally cannot add a second person today.
- **Driver assignment.** No `driverUid`/`assignedTo` field on vehicles, no
  assign/unassign callable.
- **Vehicle responsibility within an org.** Org vehicle access is binary
  (`read_only` vs. everything else) — no per-vehicle owner-within-org.
- **Fleet status tracking.** No fleet dashboard, no aggregate fleet fields.
- **Fleet compliance/reporting.** Only the generic personal-data export
  exists; no per-vehicle/per-driver compliance export for audits or
  rental/commercial requirements.
- **Custom/scoped roles.** `setOrganizationMemberRoleCallable` only ever
  assigns one of the 5 fixed roles above.

## Persona → workflow → data → screen mapping

### Household MVP (Pro tier persona, ship next)

| Workflow | Data | Screen |
| --- | --- | --- |
| Owner names and creates a shared garage | `orgs/{orgId}.name`, `.type = 'household'`, `.garageStorageMode` | **Shipped**: Web Profile -> "Shared Garage" card (`promotePersonalGarageToHouseholdCallable`) |
| Owner sees current household status | same org doc | **Shipped**: same card, read via `bootstrapEnterpriseContextCallable` |
| Owner invites a household member by email | *(missing)* `inviteOrgMemberCallable` + `orgInvites/{inviteId}` doc + accept-invite flow | *(missing)* Profile → "Invite a member" form; accept-invite landing page |
| Member sees they're part of a household and whose garage it is | `users/{uid}/orgMemberships/{orgId}` (exists), org name (exists) | *(missing)* Household banner/indicator in web Home and iOS Home |
| Owner adjusts a member's role (e.g. `read_only` for a teen driver) | `setOrganizationMemberRoleCallable` (exists) | *(missing)* Member list UI — `getOrganizationMembersCallable` has no consuming screen yet |
| iOS parity for household status | same callables | *(missing)* iOS equivalent of the Profile household card |

The invite flow is the single highest-leverage gap: without it, "household"
is a rename + vehicle copy, not a multi-person feature. It needs its own
scoped design pass (email delivery, invite expiry, accept/decline, and a
decision on whether an invited member needs to already have an account).

### Light Fleet MVP (Premium → Enterprise persona, later)

| Workflow | Data | Screen |
| --- | --- | --- |
| Manager sees all fleet vehicles in one dashboard | *(missing)* aggregate read across org vehicles (data exists, no rollup view) | *(missing)* Fleet dashboard screen |
| Manager assigns a vehicle to a driver | *(missing)* `assignedDriverUid` field + assign/unassign callable | *(missing)* Vehicle detail → "Assign driver" |
| Driver sees only their assigned vehicle(s) | *(missing)* would need a new scoped role (e.g. `driver`) restricted to assigned vehicles, since today's `read_only` role sees the whole org | *(missing)* Driver-scoped Home view |
| Manager tracks fleet-wide status/cost | *(missing)* fleet status rollup fields | *(missing)* Fleet status widget |
| Manager exports compliance/audit report | *(missing)* per-vehicle/driver compliance export | *(missing)* Fleet → "Export compliance report" |

Light Fleet depends on Household's invite flow existing first (a fleet is a
household with a `driver` role and per-vehicle assignment), so it should not
be started before that gap closes.

### Later: Enterprise controls

Per PRODUCT_DESIGN.md's Enterprise tier feature list (org policies,
ERP integrations, accounting-grade exports) — explicitly out of scope until
Household and Light Fleet MVPs are real, since Enterprise is additive
policy/integration surface on top of the same org primitives, not a
different data model.

## This round's shipped slice

Prompt 5 in this work batch already shipped the Household MVP's first two
rows above: the web Profile "Shared Garage" card lets an owner name and
promote their personal garage to a household garage, see current org
type/storage mode, and understand that vehicles are copied in — with the
invite gap explicitly called out as a TODO in the UI copy itself rather than
faked. No additional UI slice is added by this doc; it documents the gap
map that slice sits inside of.

## Suggested sequencing

1. Member invite callable + accept flow (unblocks everything else).
2. Household member-list UI consuming the already-shipped
   `getOrganizationMembersCallable`/`setOrganizationMemberRoleCallable`.
3. iOS parity for household status (mirror the web Profile card).
4. Light Fleet: `driver` role + vehicle assignment + scoped driver view.
5. Fleet dashboard + compliance export.
6. Enterprise policy/integration layer.
