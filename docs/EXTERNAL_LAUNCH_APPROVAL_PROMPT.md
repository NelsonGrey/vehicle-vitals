# Vehicle-Vitals External Launch Approval Prompt

Copy the prompt below into the review request sent to the people who hold the
required legal, commercial, operational, Apple, security, and release
authority. Replace bracketed placeholders, attach evidence by link, and do not
paste secrets, credentials, private customer data, or payment data into the
response.

---

## Review request

We are requesting a recorded launch decision for Vehicle-Vitals, consisting of
the public website and iOS app.

Release candidate:

- Repository/branch/commit: `[REPOSITORY]` / `[BRANCH]` / `[COMMIT SHA]`
- Proposed public date and time zone: `[DATE, TIME, TIME ZONE]`
- Proposed scope: `[WEB + IOS, FREE OPTION ONLY, PAID OPTIONS DEFERRED]`
- Release manager: `[NAME]`
- Evidence index: `[LINK TO GO_LIVE_RUNBOOK AND ARTIFACTS]`
- Claims matrix: `docs/LAUNCH_CLAIMS_MATRIX.md`

The software currently defaults to the following conservative public state:

- Free account creation is presented as available.
- Pro and Premium are labeled planned/coming soon; paid checkout and iOS
  purchase/restore actions are disabled.
- Unapproved paid prices and detailed paid entitlements are not presented as
  final.
- Enterprise and household multi-member workflows are described as planned,
  not current.
- The website advertises web and iPhone only, not Android.
- Website and iOS legal pages are synchronized comprehensive drafts and visibly
  marked as requiring final legal approval.
- No support response-time guarantee is shown.
- The public iOS download link stays unpublished until an approved App Store URL
  is configured.

This request does not authorize anyone to bypass the P0 gates in
`docs/GO_LIVE_RUNBOOK.md`. In particular, P0-06 release acceptance evidence and
P0-11 paid-subscription production proof remain gating items unless the release
scope explicitly defers paid subscriptions. Do not re-enable Firebase App Check
enforcement until verified client integration is deployed; the runbook records
the prior production outage and required sequence.

## Decision required from the release manager and product owner

For each line, respond `APPROVE`, `CHANGE`, or `BLOCK`, followed by the approved
wording, owner, evidence link, and decision date.

1. First-release scope: web and iOS, Free option only, with paid options deferred.
2. Value proposition: “Keep service records, receipts, reminders, and ownership
   costs together on the web and iPhone.”
3. Household scope: one signed-in account may organize household vehicles;
   invitations, roles, and additional-member access are not available at launch.
4. Work-vehicle scope: individual work-vehicle record tracking is available;
   fleet management, team controls, reporting, policies, and integrations are not
   launch claims.
5. Free vehicle capacity and all Free entitlements: `[INSERT VERIFIED MATRIX]`.
6. Whether Pro, Premium, and Enterprise remain visible as planned options or are
   removed entirely until a later launch.
7. Whether demonstration screenshots and vehicle data are approved for public
   marketing use.
8. Final support channel wording and whether any service-level commitment may be
   published.

Required output:

| Decision                        | APPROVE / CHANGE / BLOCK                        |
| ------------------------------- | ----------------------------------------------- |
| Approved launch scope           | `[EXACT SCOPE]`                                 |
| Approved value proposition      | `[EXACT COPY]`                                  |
| Approved capability limitations | `[EXACT COPY]`                                  |
| Paid-plan disposition           | `[DEFER / ENABLE AFTER SEPARATE GATE / REMOVE]` |
| Owner and date                  | `[NAME, ROLE, DATE]`                            |
| Evidence                        | `[LINKS]`                                       |

## Legal and privacy counsel review

Review the matching website and iOS Privacy Policy and Terms of Service against
the actual production data inventory and intended jurisdictions. Supply exact
replacement text rather than general comments.

Confirm or correct all of the following:

- Legal entity name, business address, privacy contact, support contact, and
  governing-law/dispute terms.
- Minimum-age and minors language.
- Categories and purposes for account identifiers, vehicle identifiers,
  mileage, license plates, service records, costs, notes, attachments, provider
  data, approximate/precise location, device diagnostics, analytics,
  advertising data, AI/document-analysis data, purchase and entitlement data,
  and support communications.
- Data sources, recipients, processors/subprocessors, international transfer
  mechanisms, sale/share/targeted-advertising position, and consent withdrawal.
- Retention rules for active accounts, backups, logs, support records,
  attachments, billing records, export packages, and deletion requests.
- Identity verification and authorized-agent handling for access, correction,
  export, deletion, objection, restriction, and appeal requests.
- CCPA/CPRA, GDPR/UK GDPR, US state privacy, consumer-protection, advertising,
  and subscription requirements that apply to the approved launch footprint.
- Vehicle-safety and maintenance disclaimer language, including recalls,
  estimates, automated/AI output, owner’s manuals, inspections, and qualified
  professional advice.
- Account deletion, data export, attachment removal, backup aging, and legally
  required retention language.
- Apple App Privacy answers, required-API declarations/privacy manifests, account
  deletion policy, Sign in with Apple obligations, and subscription disclosures.
- Whether the drafts’ effective date may be July 16, 2026 or must be replaced.

Legal deliverables:

1. Redlined and final approved Privacy Policy.
2. Redlined and final approved Terms of Service.
3. Approved effective date and version identifier.
4. Approved App Store privacy/nutrition-label answers.
5. Jurisdiction and age restrictions, if any.
6. Written authorization to remove the “final legal approval required” notices
   from both deliverables.

Legal decision: `[APPROVE / CHANGE / BLOCK]`  
Counsel name, organization, and date: `[NAME / ORGANIZATION / DATE]`  
Evidence links: `[LINKS]`

## Support and operations authority review

Provide commitments the operating team can actually staff and measure:

- Public support hours, time zone, observed holidays, supported languages, and
  customer contact channel.
- Response target by Free and any future paid tier. If no target is approved,
  explicitly approve “We will reply as soon as we can.”
- Severity definitions and escalation owners for sign-in, data loss, safety,
  privacy, billing, security, and availability incidents.
- Privacy-request intake, identity verification, statutory deadline tracking,
  export delivery, deletion confirmation, and appeal workflow.
- Billing escalation, refund/cancellation handling, charge dispute ownership,
  failed-payment recovery, and entitlement reconciliation.
- Monitoring, on-call ownership, incident communication, status-page use,
  rollback authority, and post-launch review schedule.
- App Review contact availability and ownership of the reviewer test account.

Operations deliverables:

1. Named primary and backup owners for each queue.
2. Approved customer-facing response language.
3. Internal support and incident runbooks with access verified.
4. A monitored production support submission and retrieval test.
5. Go/no-go availability confirmation for the launch window.

Operations decision: `[APPROVE / CHANGE / BLOCK]`  
Owner and date: `[NAME / DATE]`  
Evidence links: `[LINKS]`

## Paid subscriptions, Stripe, and entitlement authority review

Skip activation and leave paid options deferred unless every item below is
approved and evidenced. Do not include secret values in the review response.

- Final legal names, prices, currencies, billing periods, trials, capacity,
  entitlements, quotas, fair-use terms, taxes, cancellation, refunds, proration,
  grace periods, and support level for every paid tier.
- Production Stripe product/price identifiers and all eight required production
  secret names exist with enabled versions in `vehicle-vitals-prod`.
- Production Checkout success/cancel behavior, signed webhook handling, Customer
  Portal, failed-payment recovery, cancellation, refund, dispute, renewal, and
  entitlement reconciliation have passed with linked evidence.
- Backend authorization and quota enforcement do not rely on client-supplied
  tier state.
- Analytics purchase events contain no prohibited payment or personal data and
  do not double count redirect refreshes.
- Rollback disables new purchasing without removing legitimate existing access.
- Finance, tax, customer-support, and incident owners accept production duty.

Required paid-plan output:

| Tier       | Final price/currency | Period    | Vehicle limit | Entitlements | Support   | Approved by   |
| ---------- | -------------------- | --------- | ------------- | ------------ | --------- | ------------- |
| Pro        | `[VALUE]`            | `[VALUE]` | `[VALUE]`     | `[LINK]`     | `[VALUE]` | `[NAME/DATE]` |
| Premium    | `[VALUE]`            | `[VALUE]` | `[VALUE]`     | `[LINK]`     | `[VALUE]` | `[NAME/DATE]` |
| Enterprise | `[VALUE OR CUSTOM]`  | `[VALUE]` | `[VALUE]`     | `[LINK]`     | `[VALUE]` | `[NAME/DATE]` |

Stripe/paid-web decision: `[KEEP DEFERRED / APPROVE ENABLEMENT / BLOCK]`  
Evidence links: `[LINKS]`

If and only if enablement is approved, authorize a controlled release that sets
`VITE_PAID_SUBSCRIPTIONS_LIVE=true`. The change must be independently verified
in the deployed production build and must have a tested rollback.

## Apple and App Store authority review

The App Store Connect account holder or authorized app manager must complete and
record:

- Final app name, subtitle, description, keywords, categories, age rating,
  copyright, support URL, marketing URL, and Privacy Policy URL.
- Final screenshots for every required device size, with no credentials,
  personal data, debug labels, overflow warnings, or unapproved claims.
- App Privacy answers and required privacy manifests aligned with counsel’s
  approved data inventory.
- Sign in with Apple, account creation, in-app account deletion, export, support,
  and legal links verified in the release build.
- Review notes, demonstration account, data-reset instructions, backend
  availability, and contact details.
- Signing, bundle ID, version/build number, TestFlight processing, export
  compliance, content rights, and release method.
- If paid iOS plans are enabled: App Store product IDs, prices, localizations,
  subscription group, review screenshots, restore purchases, sandbox/TestFlight
  purchase, receipt/server validation, renewal, cancellation, refund/revocation,
  grace period, entitlement reconciliation, and reviewer access.
- Public App Store URL after Apple publishes the approved listing.

App Store deliverables:

1. App Store Connect metadata export or screenshots.
2. TestFlight/release-build identifier and acceptance evidence.
3. Approved screenshot set.
4. Approved privacy answers.
5. Review notes and reviewer-account custody owner.
6. Public listing URL after publication.

Apple decision: `[SUBMIT / CHANGE / BLOCK]`  
Authorized owner and date: `[NAME / DATE]`  
Evidence links: `[LINKS]`

If the public URL is approved, authorize setting `VITE_IOS_APP_STORE_URL` to
that exact URL. If iOS paid subscriptions are separately approved, authorize a
release build with `--dart-define=VV_PAID_SUBSCRIPTIONS_LIVE=true`. Otherwise it
must remain false.

## Security and platform authority review

Confirm the following before a public launch decision:

- P0 security and release findings in the go-live runbook are closed or have an
  explicitly accepted, time-bounded risk owner.
- No public screenshot, video, log, build artifact, test account, or source file
  exposes credentials, tokens, personal data, or active reusable demo secrets.
- Production rules, indexes, Storage authorization, account deletion, export,
  backups, logging, alerts, secret access, and recovery are verified.
- The release uses the intended production Firebase environment.
- Firebase App Check remains unenforced until web and iOS clients implement and
  verify valid tokens. Re-enforcement requires a staged rollout and rollback
  evidence; it must not be treated as a console-only switch.
- The reviewer/demo account has least privilege, synthetic data, an owner, a
  rotation plan, and a post-review disable/rotate action.

Security decision: `[APPROVE / ACCEPT TIME-BOUNDED RISK / BLOCK]`  
Owner and date: `[NAME / DATE]`  
Exceptions with expiry dates: `[LIST]`  
Evidence links: `[LINKS]`

## Final release-manager attestation

Do not sign this section until the preceding authorities have responded and all
required evidence is linked.

- [ ] P0-06 acceptance and backend evidence is PASS.
- [ ] Paid plans are either demonstrably production-ready or explicitly
      deferred with launch flags false.
- [ ] Legal final text is deployed identically on website and iOS, with the
      draft notice removed only under written counsel authorization.
- [ ] Support and privacy operations are staffed and tested.
- [ ] Apple metadata, privacy answers, screenshots, build, and review packet are
      complete.
- [ ] Marketing copy matches `docs/LAUNCH_CLAIMS_MATRIX.md`.
- [ ] Website checks pass at mobile, tablet, small-laptop, and desktop sizes.
- [ ] iPhone checks pass for signed-out, onboarding, core tasks, settings,
      support, legal, export/deletion, and planned-plan states.
- [ ] Rollback owner, monitoring owner, and launch-window contacts are present.
- [ ] The go-live runbook has been updated with current evidence and decision.

Final decision: `[GO / NO-GO]`  
Approved scope: `[EXACT SCOPE]`  
Release manager, date, time, and time zone: `[NAME / DATE / TIME / TIME ZONE]`  
Approver signatures or decision-record links: `[LINKS]`

---

No verbal approval, calendar invitation, unpublished draft, successful local
build, or absence of a known incident is a substitute for the recorded
authority and evidence requested above.
