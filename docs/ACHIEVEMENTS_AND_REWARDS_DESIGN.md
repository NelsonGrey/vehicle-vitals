# Achievements & Rewards Design

**Updated**: 2026-07-22
**Status**: Design only — not yet implemented
**Owner**: Mark Nelson

Adapted from the equivalent design in `modulo-squares` (`docs/Achievements_And_Rewards_Design.md`), but re-derived against Vehicle Vitals' own domain, users, and tone rather than ported wholesale — see [Why this isn't a copy](#why-this-isnt-a-copy) at the end.

## Definitions

**Achievement** — a named, discrete accomplishment tied to a specific condition. Either binary (earned/not earned) or a tiered track crossed by a numeric threshold. An achievement is a rule, not a payoff.

**Reward** — the payoff granted when an achievement (or a tier of one) is earned: a badge, a cosmetic, a title, a flair. Every reward traces back to an achievement trigger; not every achievement needs a tangible reward beyond recognition.

Keeping the two separate matters for implementation: achievement definitions are static data (id, condition, threshold), and reward-granting is a separate system that reacts to an "achievement unlocked" event.

## Grounding: what's already here

Before designing anything new, two things already exist and this design builds on them rather than replacing them:

- **`packages/web/src/utils/garageCompleteness.ts`** — a document-completeness score across all vehicles, mapped to a 3-tier system: `rookie` (&lt;50%), `pro` (50–89%), `champion` (≥90%), each with a racing-flag motif (🏁 🏎️ 🏆). It's explicitly described in code as "a lightweight, subtle gamification signal." That phrase — *lightweight, subtle* — is the design constraint this whole document should honor. It's currently a display-only computed value with no reward-granting event behind it.
- **`docs/USER_GUIDE.md`** surfaces the same idea as a "7/7 complete" document badge.

There is no achievement, streak, leaderboard, reward, or points system anywhere else in the repo. One persona in `docs/BUSINESS_REQUIREMENTS.md` is described as "motivated by gamification and social features," but nothing downstream acts on that trait today.

## Why the source doc's categories don't transfer directly

`modulo-squares` is a scored arcade game — its players have "runs," a skill ceiling, and an adversarial leaderboard to protect. Vehicle Vitals is a record-keeping tool whose own marketing language is "proof when you need it," "credible ownership record," "audit," "compliance export." There is no "getting good at the game" here — the equivalent of skill is **diligence**: did you keep the garage complete and current. And there's no run to evaluate achievements from; almost everything is a lifetime Firestore state, not session data.

So the category split is re-derived, not renamed-in-place:

| Category | Question it answers | Repeatable |
|---|---|---|
| Foundation | Is the garage set up right? | No (one-time) |
| Stewardship | Is the user keeping the garage complete and current? | Yes (tiered) |
| Household | Is the whole household's garage staying healthy? | Yes (deferred — see [Dependency](#dependency)) |

Notably absent: a "Competitive" category built around ranking users against each other. That framing fits a leaderboard game; it fits a shared-family-car-maintenance tool much less well. See [Household achievements](#household-achievements-collaborative-not-competitive) below for why this is reframed as collaborative rather than dropped entirely.

## Foundation achievements (setup/onboarding)

One-time, flat, non-tiered. Each fires once, on first occurrence.

| Achievement | Trigger |
|---|---|
| Welcome Aboard | Account created, first vehicle added via VIN lookup |
| Full Profile | Vehicle profile completed beyond VIN defaults (year/make/model/plate/photo) |
| Paper Trail Started | First document or receipt uploaded and AI-processed |
| On the Radar | First maintenance reminder created |
| Synced Up | Calendar sync enabled |
| Signed & Sealed | Apple or Google sign-in linked (vs. staying anonymous/email-only) |
| Growing the Garage | Second vehicle added |
| Went Premium | Upgrade to Pro, Premium, or Enterprise completed |
| Restored | Restore Purchases used successfully (mobile) |

"Growing the Garage" deliberately sits at vehicle #2, one below the Free-tier 3rd-vehicle upgrade prompt (`docs/MONETIZATION_STRATEGY.md`) — it's a milestone inside the free tier, not a paywall nudge. See [Open decisions](#open-decisions) on where achievement thresholds and monetization upgrade triggers should and shouldn't overlap.

## Stewardship achievements (ongoing diligence)

Tiered tracks, repeatable, evaluated against lifetime account state (not a single session — there's no equivalent of a "run"). Shared tier ladder across all tracks:

| Tier | Name |
|---|---|
| 1 | Rookie |
| 2 | Driver |
| 3 | Pro |
| 4 | Veteran |
| 5 | Champion |

Rookie/Pro/Champion are the exact labels `garageCompleteness.ts` already ships; Driver and Veteran extend the same road/garage vocabulary rather than introducing a competing naming scheme. **The existing Garage Completeness thresholds (&lt;50% / 50–89% / ≥90%) are left untouched** — that's shipped, tuned, user-visible copy; this document doesn't propose changing it, only wiring it into a reward-granting event it doesn't have today (see [Implementation notes](#implementation-notes)).

### Tracks and thresholds (draft — tune against real usage data once available)

**Garage Completeness** — existing track, unchanged. 3-tier only (Rookie/Pro/Champion), per current shipped thresholds above.

**Fleet Builder** — vehicles actively tracked in the garage
| Rookie | Driver | Pro | Veteran | Champion |
|---|---|---|---|---|
| 1 | 2 | 3 | 5 | 10+ |

**On Schedule** — maintenance reminders completed on or before their due date (vs. dismissed/lapsed)
| Rookie | Driver | Pro | Veteran | Champion |
|---|---|---|---|---|
| 3 | 10 | 25 | 50 | 100+ |

**Paper Trail** — lifetime documents/receipts uploaded and processed
| Rookie | Driver | Pro | Veteran | Champion |
|---|---|---|---|---|
| 5 | 25 | 100 | 300 | 1,000+ |

**Maintenance Logger** — lifetime maintenance events logged (self-service or mechanic)
| Rookie | Driver | Pro | Veteran | Champion |
|---|---|---|---|---|
| 3 | 10 | 30 | 75 | 200+ |

**Health Streak** — consecutive months the Vehicle Health score for a vehicle stays at or above "good" (per `docs/VEHICLE_HEALTH_DASHBOARD_SPEC.md`'s scoring bands)
| Rookie | Driver | Pro | Veteran | Champion |
|---|---|---|---|---|
| 1 mo | 3 mo | 6 mo | 12 mo | 24 mo+ |

Health Streak is the closest thing here to "skill" — it rewards staying ahead of maintenance rather than reacting to an already-lapsed reminder.

## Household achievements (collaborative, not competitive)

The source doc's "Competitive" category assumes players who benefit from being ranked against each other. That doesn't fit a family sharing a garage — ranking a spouse or teenager against the primary account holder on "who logs more maintenance" reads as passive-aggressive, not motivating, and cuts against the app's credible-record-keeping tone. If this category is built, it should be framed as **shared household goals**, not a ladder:

| Achievement | Trigger |
|---|---|
| Everyone's In | All household members have linked accounts and added at least one vehicle |
| Whole Garage, Up to Date | Every vehicle in the household has zero overdue reminders, simultaneously |
| Household Health Streak | Aggregate Vehicle Health score across all household vehicles stays "good" for N consecutive months |

No individual ranking, no "most improved" member, no per-person leaderboard.

### Dependency

This category is unreachable today, and for a more fundamental reason than the source doc's leaderboard-wiring gap: `docs/HOUSEHOLD_FLEET_IMPLEMENTATION_PLAN.md` states plainly that member invites are unbuilt — *"a household literally cannot add a second person today."* The org/role model (`orgs/{orgId}`, 5 roles) exists architecturally, but there is no invite flow to populate it. Household achievements need that gap closed first; there's no partial version of "collaborative across household members" that works with exactly one member.

## Rewards

Cosmetic/status only — same principle as the source doc, different reason. `modulo-squares` protects a fair, skill-pure leaderboard from pay-to-win distortion. Vehicle Vitals has no leaderboard to protect; the reason to keep rewards non-mechanical here is that achievements must never become a second, competing gating system alongside the subscription tiers (Free/Pro/Premium/Enterprise) that already gate real functionality (`docs/PRODUCT_DESIGN.md`). An achievement should never unlock a reminder, an export, or an AI-processing capability — that's the subscription system's job, and blending the two would confuse both.

Candidate reward types:
- A small badge/icon on the vehicle card or garage profile (Settings and dashboard), reusing the existing racing-flag motif tier-by-tier
- Unlocked vehicle-card color themes at higher tiers
- A **"Verified Complete Garage" stamp on PDF/CSV exports** once Champion tier is reached on Garage Completeness — this is the one reward genuinely native to this app: it plugs into the existing export feature (`docs/PRODUCT_DESIGN.md`) and reinforces the "proof when you need it" pitch directly, instead of being pure vanity flair with no connection to what the app is actually for
- A "Garage Milestones" screen (this app's equivalent of a Trophy Case) listing achievements and current tier per track, scoped per-vehicle where relevant (Health Streak, Maintenance Logger) and per-garage where not (Garage Completeness, Fleet Builder)

## Implementation notes

- Almost nothing here is client-evaluable from ephemeral session data the way a game run is — there is no "run" in Vehicle Vitals. Foundation achievements and Garage Completeness / Fleet Builder can be read directly from existing Firestore state with no schema changes (vehicle count and document-completeness are already computed). On Schedule, Paper Trail, Maintenance Logger, and Health Streak need either a count over an existing subcollection (cheap, no new fields) or a maintained cumulative counter if collection-count queries become too expensive at scale — flagged as an open decision below, not resolved here.
- Spoofing risk is much lower stakes here than in `modulo-squares`: there's no adversarial incentive to inflate your own vehicle's maintenance history when the only audience is yourself (and, per the tone of this app, your own future insurance/warranty/resale use of the record). Server-validation urgency only rises if Household achievements ship — at that point one member's inflated stats become visible to others, and the same spoofing concern the source doc raised for its Grinder/Competitive tracks would apply here too.
- Recommend a v1 slice: Foundation achievements plus the Garage Completeness and Fleet Builder tracks — both already backed by existing, unchanged data, requiring only the reward-granting event layer on top of `garageCompleteness.ts`'s existing output. Defer Household achievements until the invite flow ships, and defer On Schedule / Paper Trail / Maintenance Logger / Health Streak until there's a usage-data basis for the draft thresholds above.

## Open decisions

1. Exact numeric thresholds above are a draft — tune against real product usage data once available (no playtesting equivalent exists here; this needs analytics, not a beta cohort).
2. Whether Foundation-achievement thresholds (e.g. "Growing the Garage" at vehicle #2) should ever be allowed to sit adjacent to monetization upgrade triggers (vehicle #3, document #11 per `docs/MONETIZATION_STRATEGY.md`) or whether they need a deliberate buffer so an achievement never reads as a paywall prompt in disguise.
3. Whether to build Household achievements at all once the invite flow lands, or drop the category — the collaborative reframing above removes the ranking problem, but the value of any household-level gamification for a small (2-4 person) household is unproven.
4. Whether the export-stamp reward is worth the design/legal thought (a "Verified Complete Garage" stamp on an exported PDF is closer to a real claim than a cosmetic flourish, and should not overstate what "complete" or "verified" means) or whether it should stay purely in-app.
5. Scope for initial ship: full design above, or the v1 slice described in Implementation notes.

## Why this isn't a copy

The temptation with a second design in this space is to keep the shape (three categories, five tiers, cosmetic rewards, an implementation-notes and open-decisions section) and just relabel the words. Where that shape genuinely fits — the achievement/reward split, the "don't grant mechanical power" principle, flagging a hard dependency before designing around it — it's kept. Where it doesn't fit — "skill-based," "Competitive," a run-scoped session model, a five-tier ladder invented from scratch when a three-tier one already ships — it's replaced with something derived from what this app's users actually do and what tone this app has already committed to in its own copy and code.
