# Vehicle-Vitals Launch Claims Matrix

Last updated: September 1, 2026
Launch decision recorded: LAUNCHED (`docs/GO_LIVE_RUNBOOK.md`, 2026-09-01) — iOS 1.0 approved.

This matrix remains the copy source of truth for the website and iOS app.
Customer-facing claims must describe the capability that is demonstrably
available in the release build, not an intended roadmap state.

> **Partial re-verification, 2026-09-01.** The "Approved for the current
> release candidate" rows still describe the shipped behaviour and are left
> as-is. Three rows in "Planned or approval-dependent claims" are now stale
> against the launch and are annotated inline below (⚠️) — each needs an
> owner decision, not just a copy edit:
> - **Pro and Premium purchasing** — Apple approved the IAP subscriptions as
>   part of the 1.0 submission (`8b517b4f`) and web uses live Stripe, so paid
>   purchasing is effectively live. The `VITE_PAID_SUBSCRIPTIONS_LIVE` /
>   `VV_PAID_SUBSCRIPTIONS_LIVE` activation flag named below **does not exist
>   in the codebase** (grep: 0 hits) — the real paywall wiring is
>   unconditional. Decide whether to formally mark this claim active and
>   retire the flag language.
> - **App Store download link** — the listing is public
>   (`https://apps.apple.com/app/vehicle-vitals/id6783861086`) but
>   `VITE_IOS_APP_STORE_URL` is still unset in every committed env, so the
>   web still shows the "validation in progress" fallback. Set the secret.
> - **Legal terms and privacy statements** — the "pending legal review /
>   final-approval notice" was **removed from the app** (commit `030e590`) so
>   Terms could serve as a valid EULA link for Apple. The "Current
>   presentation" text below no longer matches; confirm counsel signoff
>   status and update accordingly.

## Approved for the current release candidate

| Topic                | Approved customer wording                                                         | Website evidence                              | iOS evidence                               | Guardrail                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Core value           | Keep service records, receipts, reminders, and ownership costs together.          | Landing, persona pages, Product Tour          | Welcome, Garage, Records, Maintenance Plan | Do not promise that recommendations replace the owner’s manual or professional advice.                           |
| Platforms            | Available on the web and iPhone.                                                  | Landing and Getting Started                   | Current iOS build                          | Do not claim Android availability.                                                                               |
| Vehicle records      | Save completed work, mileage, costs, notes, providers, receipts, and attachments. | Product Tour and ownership-history content    | Records and service-entry flows            | Attachments and automated analysis may depend on connectivity and plan entitlement.                              |
| Maintenance planning | Review available recommendations and saved reminders.                             | Product Tour and maintenance-planning content | Maintenance Plan                           | Use “available recommendations”; never say the vehicle is fully maintained merely because no task is shown.      |
| Service history      | Review completed maintenance by vehicle and date.                                 | Product Tour                                  | Service History                            | History is only as complete as the records supplied by the customer and connected services.                      |
| Household use        | One signed-in account can organize household vehicles in a household garage.      | Household persona and Account                 | Garage and Account                         | Additional member invitations, roles, and simultaneous household access are not launch claims.                   |
| Work vehicles        | Track records for individual work vehicles from one account.                      | Work Vehicles persona                         | Garage and Records                         | Do not describe this release as fleet management or promise team controls, reporting, policies, or integrations. |
| Free availability    | Customers can start with the Free option.                                         | Landing, Plans, signup                        | Welcome, signup, Plans & Billing           | Capacity and entitlement details must match production configuration.                                            |
| Data controls        | Customers can request export or deletion from Account.                            | Data & Privacy                                | Data & Privacy                             | Do not state a guaranteed completion time until the operating owner and counsel approve one.                     |
| Support              | Customers can submit a support request.                                           | Support                                       | Support                                    | Do not promise a response time until staffing and escalation commitments are approved.                           |

## Planned or approval-dependent claims

| Claim                              | Current presentation                                             | Authority/evidence required before activation                                                                                                                  | Activation control                                                                                                                                             |
| ---------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pro and Premium purchasing         | “Coming soon” / “Pricing pending approval”                       | Product owner approval, final price and entitlement matrix, production Stripe and App Store purchase evidence, refund/cancellation recovery, support readiness | Set `VITE_PAID_SUBSCRIPTIONS_LIVE=true` and build iOS with `--dart-define=VV_PAID_SUBSCRIPTIONS_LIVE=true` only after all evidence is linked from the runbook. |
| Enterprise/team workflows          | “Discuss planned needs”                                          | Approved product scope, contract terms, operating owner, support model, and verified roles/reporting/integration workflows                                     | Update this matrix and customer copy in the same change that enables the verified capability.                                                                  |
| Household member invitations       | Explicitly unavailable in this release                           | Verified invitation, acceptance, role, removal, audit, and shared-data authorization flows on web and iOS                                                      | Remove the limitation only after cross-account acceptance tests pass.                                                                                          |
| Priority support                   | Terms pending approval                                           | Named owner, service hours, response target, escalation policy, and paid entitlement verification                                                              | Publish the exact approved commitment in Plans, Help, Terms, and support operations together.                                                                  |
| App Store download link            | “Final release validation in progress” when no URL is configured | Approved public App Store listing                                                                                                                              | Set `VITE_IOS_APP_STORE_URL` to the approved listing URL.                                                                                                      |
| Legal terms and privacy statements | Comprehensive draft with a visible final-approval notice         | Legal counsel and product/data-owner signoff                                                                                                                   | Replace the notice, approved text, and effective date together on web and iOS.                                                                                 |
| Product videos                     | Not shown                                                        | Current release footage, accessibility captions/transcript, privacy review, and product-owner approval                                                         | Add only verified media that matches the current navigation and terminology.                                                                                   |

## Prohibited until re-approved

- Android availability or “all platforms.”
- “Fleet management,” operational reporting, team roles, or API integrations as
  current capabilities.
- Shared household member access or invitations as a current capability.
- Guaranteed maintenance accuracy, safety, savings, resale value, or repair
  outcomes.
- Guaranteed support, export, or deletion response times.
- Live paid prices, purchase buttons, or subscription entitlements before the
  production purchase gates are closed.
- “Unlimited” usage without a precise, enforceable fair-use and quota policy.

## Change procedure

1. Link the release-build evidence that proves the claim on both applicable
   platforms.
2. Record the approving owner and date in the go-live runbook.
3. Update this matrix, website copy, iOS copy, help content, legal content, SEO,
   and store metadata as one coordinated change.
4. Run unit, build, accessibility, small-laptop, mobile-web, and iPhone visual
   checks before publishing.
