# Vehicle Vitals - Master Project Plan

Last updated: April 13, 2026
Planning horizon: 8 weeks
Primary source status: docs/REQUIREMENTS.md
Execution detail for R1: docs/R1_COMPLETION_CHECKLIST.md

## Plan Goal

Deliver production-capable parity by closing all R1 gates, then complete R2 parity and reliability work in a controlled sequence.

## Milestone Schedule

| Window   | Milestone                      | Outcome                                                            |
| -------- | ------------------------------ | ------------------------------------------------------------------ |
| Week 1-2 | R1 Gate 1 and Gate 2           | Reminder reliability evidence + mobile runtime parity evidence     |
| Week 3   | R1 Gate 3                      | Export parity signoff package complete                             |
| Week 4-5 | R2 Calendar and Timeline       | Reliable calendar UX + improved mobile timeline parity             |
| Week 6   | R2 API enrichment              | Manuals/warranty/maintenance-plan surfaced with stable UX          |
| Week 7   | R3 Forecasting pass            | Forecasting improvements defined and first release slice delivered |
| Week 8   | Stabilization and release prep | Regression pass, documentation sync, release recommendation        |

## Calendarized Schedule (2026)

| Week   | Date Range      | Primary Focus                                       |
| ------ | --------------- | --------------------------------------------------- |
| Week 1 | Apr 13 - Apr 17 | R1 gate setup, owner assignment, preflight checks   |
| Week 2 | Apr 20 - Apr 24 | Execute Gate 1 and Gate 2 evidence runs             |
| Week 3 | Apr 27 - May 1  | Execute Gate 3 parity signoff and R1 closure review |
| Week 4 | May 4 - May 8   | R2 calendar reliability and UX hardening            |
| Week 5 | May 11 - May 15 | R2 timeline parity completion                       |
| Week 6 | May 18 - May 22 | R2 API enrichment client integration                |
| Week 7 | May 25 - May 29 | R3 forecasting first release slice                  |
| Week 8 | Jun 1 - Jun 5   | Stabilization, regression, release recommendation   |

## Workstreams

### WS1: R1 Production Gates (Critical Path)

Scope:

- Reminder delivery reliability
- Mobile runtime parity validation
- Export parity signoff

Dependencies:

- Provider environment configuration
- Stable smoke dataset
- iOS build environment readiness

Evidence outputs:

- artifacts/smoke/r1-reminder-\*.log
- artifacts/smoke/r1-mobile-\*.log
- artifacts/smoke/r1-export-\*

Exit:

- All gates marked Done in docs/R1_COMPLETION_CHECKLIST.md

### WS2: R2 Product Parity

Scope:

- Calendar reliability and fallback UX
- Mobile timeline depth and semantic parity
- API enrichment client integration

Dependencies:

- R1 complete
- Contract stability for integration endpoints

Exit:

- R2 items marked complete in docs/NEXT_FEATURES_EXECUTION_PLAN.md

### WS3: R3-R4 Expansion Readiness

Scope:

- Budget forecasting improvements
- Service provider expansion
- Premium/ad hardening
- Fleet design and implementation kickoff

Dependencies:

- R1 and core R2 complete

Exit:

- Approved R3 release slice and R4 implementation plan

## Team Ownership Model

| Area                      | Suggested Role         | Owner      | Backup     |
| ------------------------- | ---------------------- | ---------- | ---------- |
| Reminder reliability      | Functions lead         | Unassigned | Unassigned |
| Mobile parity validation  | Mobile lead            | Unassigned | Unassigned |
| Export parity             | Web + Mobile QA owner  | Unassigned | Unassigned |
| Calendar parity           | Full-stack owner       | Unassigned | Unassigned |
| API enrichment            | Backend + client owner | Unassigned | Unassigned |
| Release evidence tracking | Release manager        | Unassigned | Unassigned |

## Weekly Operating Cadence

- Monday: plan review and owner assignment updates
- Wednesday: mid-week risk and blocker review
- Friday: evidence review and status publication

Required updates every week:

1. Update docs/R1_COMPLETION_CHECKLIST.md dashboard
2. Sync docs/REQUIREMENTS.md and docs/RELEASE_SCOPE_MATRIX.md when status changes
3. Update docs/NEXT_FEATURES_EXECUTION_PLAN.md progress notes

## R1 Decision Checkpoints

| Checkpoint         | Target Date  | Entry Criteria                                 | Exit Criteria                                    |
| ------------------ | ------------ | ---------------------------------------------- | ------------------------------------------------ |
| R1 Midpoint Review | Apr 24, 2026 | Gate 1 and Gate 2 evidence runs completed      | Risks documented and corrective actions assigned |
| R1 Closure Review  | May 1, 2026  | Gate 3 evidence complete and checklist updated | R1 go or no-go decision recorded                 |

If entry criteria are not met at a checkpoint, the plan requires a dated rebaseline in this file and docs/NEXT_FEATURES_EXECUTION_PLAN.md.

## Critical Path and Dependencies

1. R1 Gate 1 reminder reliability
2. R1 Gate 2 mobile runtime parity
3. R1 Gate 3 export parity signoff
4. R2 calendar and timeline parity
5. R2 API enrichment completion

If any R1 gate slips, R2 start should be treated as at-risk.

## Risk Register

| Risk                                    | Impact | Likelihood | Mitigation                                               | Owner      |
| --------------------------------------- | ------ | ---------- | -------------------------------------------------------- | ---------- |
| Provider credentials misconfigured      | High   | Medium     | Run preflight env checklist before each gate run         | Unassigned |
| iOS release build instability           | High   | Medium     | Keep reproducible build logs and fallback simulator path | Unassigned |
| Export parity drift from schema changes | Medium | Medium     | Freeze fixture schema during parity window               | Unassigned |
| Integration endpoint variability        | Medium | Medium     | Use fixed test VINs and controlled cache settings        | Unassigned |
| Scope creep into R4 features            | Medium | High       | Enforce R1-first governance in weekly review             | Unassigned |

## Definition of Done by Milestone

### R1 Done

- All three gates complete with linked evidence artifacts
- Docs synchronized across requirements, matrix, and execution plan
- Release recommendation includes known residual risks

### R2 Done

- Calendar reliability validated for supported targets
- Timeline parity improvements accepted
- API enrichment visible in client UX with fallback behavior

### R3 Done

- Forecasting slice delivered with measurable acceptance checks

## Immediate Next 10 Business Days

1. Assign owners and target dates for all R1 gates.
2. Execute reminder reliability gate and publish evidence.
3. Execute mobile parity validation and publish evidence.
4. Execute export parity signoff and publish parity report.
5. Hold R1 completion review and issue go/no-go recommendation for R2.
