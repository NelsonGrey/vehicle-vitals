# Product Design Progress Tracker

Last updated: March 13, 2026
Source of truth: docs/PRODUCT_DESIGN.md

## Executive Snapshot

- Web and iOS core flows are live.
- UX visual parity is improving, but mobile still has screen-level drift where hardcoded legacy colors remain.
- Delivery maturity is strongest in vehicle CRUD and basic maintenance capture.
- Delivery maturity is partial for timeline depth, smart reminders, and exports.

## Progress Matrix Against Product Design

| Product Area                         | Design Intent                                          | Current Delivery Status | Notes                                                                                     |
| ------------------------------------ | ------------------------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| Cross-platform consistency           | Web and iOS should feel like one product               | In progress             | Theme parity implemented at token/theme level; residual screen-level drift being removed. |
| Multi-vehicle management             | Manage several vehicles with clear dashboard hierarchy | Partial to strong       | Core CRUD works; hierarchy is present; polish and consistency still ongoing.              |
| VIN decode and auto-populate         | Decode VIN, prefill profile fields and recalls         | Partial                 | Implemented in add/edit flows with callable fallback paths.                               |
| Maintenance timeline                 | Clear, chronological, actionable timeline              | Partial                 | Timeline surfaces exist; still maturing depth and presentation consistency.               |
| Smart alerts and reminder actions    | Dismiss, snooze, complete with clear urgency           | Partial                 | Reminder persistence APIs exist; full end-to-end UI behavior is still uneven.             |
| Export records for compliance/resale | PDF/CSV exports with confidence                        | Partial                 | Export capability exists in web and limited mobile paths; not complete parity.            |
| Fleet manager workflows              | Fleet overview and role-based control                  | Planned                 | Not implemented in active routes.                                                         |
| Budget insights and forecasting      | Cost trends and forecasted spend                       | Partial                 | Analytics screens exist; advanced forecasting remains limited.                            |

## iOS Visual Parity Focus

Completed:

- Shared token palette moved to slate/teal style language.
- Theme-level card, nav, and snackbar defaults aligned.
- Primary navigation routes and profile path parity implemented.
- Add/Edit/Upcoming/Offline screens moved from hardcoded legacy colors to semantic theme colors.

Remaining high-priority parity work:

- Align iconography and urgency chips to the same semantic palette used in web.
- Harmonize spacing and card rhythm in long-form data entry screens.

## Demo and Test Data Readiness

Completed in this pass:

- Repeatable seed and purge scripts added under functions package.
- Versioned dataset file added at scripts/test-data/demo-data.json.
- Operator guide added at scripts/test-data/README.md.

Operational target:

- Any demo account can be reset in under 1 minute with seed and purge commands.
