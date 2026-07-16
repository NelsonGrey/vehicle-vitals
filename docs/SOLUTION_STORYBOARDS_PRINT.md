# Vehicle-Vitals Website Storyboards

Last updated: May 20, 2026
Purpose: Website-only storyboard deck with screenshot-first pages for workshop and print review.

## 1) Format and Page Target

- Scope: website only (no mobile storyboards in this deck)
- Layout: each storyboard page starts with one prominent screenshot and keeps supporting context on the same page
- Target length: 12 storyboard pages plus 1-2 setup pages (12-14 total pages in print)

<style>
	.storyboard-shot {
		margin: 0 0 10px 0;
	}
	.storyboard-shot img {
		width: 100%;
		max-height: 5in;
		object-fit: contain;
		border: 1px solid #d6d6d6;
	}
</style>

## 2) Coverage Matrix (Website Only)

| Requirement stream                             | Source docs                                         | Storyboards                |
| ---------------------------------------------- | --------------------------------------------------- | -------------------------- |
| Value proposition and onboarding funnel        | BUSINESS_REQUIREMENTS.md, PRODUCT_DESIGN.md         | SB-01, SB-02, SB-03        |
| Vehicle setup and maintenance workflows        | REQUIREMENTS.md, API_DATA_MODELS.md                 | SB-04, SB-05, SB-06, SB-07 |
| Service provider conversion and trust          | PRODUCT_DESIGN.md, SECURITY_IMPLEMENTATION.md       | SB-08, SB-09, SB-10        |
| Multi-vehicle operations and release readiness | RELEASE_SCOPE_MATRIX.md, R1_COMPLETION_CHECKLIST.md | SB-11, SB-12               |

---

## SB-01 Marketing Value Promise

<div class="storyboard-shot"><img src="screenshots/landing.png" alt="SB-01 Landing" /></div>

Business focus:

- Communicate value in under 10 seconds
- Encourage sign-in and first vehicle setup

Technical focus:

- Stable public marketing routes and asset performance
- Environment-gated access behavior aligned with deployment policy

Review prompts:

- Is value proposition instantly clear?
- Is the first call-to-action obvious and trustworthy?

<div style="page-break-after: always;"></div>

## SB-02 Sign-In and Returning User Access

<div class="storyboard-shot"><img src="screenshots/login.png" alt="SB-02 Login" /></div>

Business focus:

- Reduce friction for returning users
- Preserve trust through clear access patterns

Technical focus:

- Authentication route protection and redirect behavior
- Error-safe login state handling

Review prompts:

- Is login intent clear for all user segments?
- Are failure states specific enough for recovery?

<div style="page-break-after: always;"></div>

## SB-03 New Account Conversion

<div class="storyboard-shot"><img src="screenshots/signup.png" alt="SB-03 Signup" /></div>

Business focus:

- Increase successful account creation
- Minimize abandonment during sign-up

Technical focus:

- Account creation validation and secure credential handling
- Post-signup transition to app onboarding

Review prompts:

- Which form fields create unnecessary friction?
- Is the next-step path clear immediately after signup?

<div style="page-break-after: always;"></div>

## SB-04 Vehicle Intake and VIN Start

<div class="storyboard-shot"><img src="screenshots/add-vehicle.png" alt="SB-04 Add Vehicle" /></div>

Business focus:

- Enable fast first-vehicle completion
- Improve data quality for downstream reminders

Technical focus:

- VIN lookup integration and graceful fallback states
- Required-field validation aligned with Firestore schema

Review prompts:

- Does the form balance speed and accuracy?
- Is manual fallback obvious when VIN lookup fails?

<div style="page-break-after: always;"></div>

## SB-05 Maintenance Entry and Record Quality

<div class="storyboard-shot"><img src="screenshots/edit-vehicle.png" alt="SB-05 Edit Vehicle" /></div>

Business focus:

- Make maintenance logging repeatable and fast
- Protect service history value for owners

Technical focus:

- Maintenance CRUD consistency
- Data integrity for mileage/date/cost fields

Review prompts:

- What blocks quick entry for common services?
- Which fields are essential for analytics and reminders?

<div style="page-break-after: always;"></div>

## SB-06 Reminder Queue and Upcoming Actions

<div class="storyboard-shot"><img src="screenshots/upcoming.png" alt="SB-06 Upcoming" /></div>

Business focus:

- Convert reminders into completed maintenance actions
- Reduce missed service events

Technical focus:

- Reminder lifecycle reliability (complete, snooze, dismiss, reopen)
- Calendar action resilience and fallback behavior

Review prompts:

- Is urgency clearly communicated?
- Are action choices clear enough for fast decisions?

<div style="page-break-after: always;"></div>

## SB-07 Maintenance Timeline and Decision Context

<div class="storyboard-shot"><img src="screenshots/timeline.png" alt="SB-07 Timeline" /></div>

Business focus:

- Help owners understand what happened and what is next
- Improve confidence in maintenance planning

Technical focus:

- Timeline query performance and ordering consistency
- Accurate aggregation for multi-entry histories

Review prompts:

- Is chronology understandable at a glance?
- Which timeline details are critical versus optional?

<div style="page-break-after: always;"></div>

## SB-08 Records and Documentation Readiness

<div class="storyboard-shot"><img src="screenshots/records.png" alt="SB-08 Records" /></div>

Business focus:

- Strengthen resale and warranty evidence value
- Keep maintenance records easy to review and export

Technical focus:

- Document linkage and record completeness
- Export-ready data shape and consistency

Review prompts:

- Can a user quickly verify complete service history?
- What record fields need stronger visual priority?

<div style="page-break-after: always;"></div>

## SB-09 Nearby Service Provider Conversion

<div class="storyboard-shot"><img src="screenshots/providers.png" alt="SB-09 Providers" /></div>

Business focus:

- Turn insight into concrete repair-shop actions
- Improve trust in provider recommendations

Technical focus:

- Callable provider lookup reliability
- Preference persistence for radius/type/make filters

Review prompts:

- Are provider results credible enough to act on?
- Is no-results recovery behavior clear and useful?

<div style="page-break-after: always;"></div>

## SB-10 Profile, Preferences, and Security Signals

<div class="storyboard-shot"><img src="screenshots/profile.png" alt="SB-10 Profile" /></div>

Business focus:

- Give users confidence over account and reminder settings
- Support long-term retention through personalization

Technical focus:

- Preference persistence accuracy
- Authenticated profile data protections and access boundaries

Review prompts:

- Are settings grouped in a way that matches user intent?
- Where do users need stronger confirmation feedback?

<div style="page-break-after: always;"></div>

## SB-11 Garage Portfolio Overview

<div class="storyboard-shot"><img src="screenshots/garage-vehicles.png" alt="SB-11 Garage Vehicles" /></div>

Business focus:

- Support multi-vehicle ownership workflows
- Increase dashboard utility for households and fleets

Technical focus:

- Vehicle list performance and state synchronization
- Summary metric correctness across multiple vehicles

Review prompts:

- Can users quickly identify each vehicle's status?
- Which portfolio metrics should be surfaced first?

<div style="page-break-after: always;"></div>

## SB-12 Vehicle Detail and Operational Next Step

<div class="storyboard-shot"><img src="screenshots/garage-detail.png" alt="SB-12 Garage Detail" /></div>

Business focus:

- Help users move from awareness to action on one vehicle
- Keep critical service information immediately accessible

Technical focus:

- Detail view consistency with timeline/upcoming data
- Action routing stability to edit, records, and provider flows

Review prompts:

- Is the next best action obvious for this vehicle state?
- What detail modules should be reordered for clarity?

---

## Workshop Scoring Grid

| Storyboard | Business clarity (1-5) | Technical feasibility (1-5) | UX clarity (1-5) | Rework priority (H/M/L) | Notes |
| ---------- | ---------------------- | --------------------------- | ---------------- | ----------------------- | ----- |
| SB-01      |                        |                             |                  |                         |       |
| SB-02      |                        |                             |                  |                         |       |
| SB-03      |                        |                             |                  |                         |       |
| SB-04      |                        |                             |                  |                         |       |
| SB-05      |                        |                             |                  |                         |       |
| SB-06      |                        |                             |                  |                         |       |
| SB-07      |                        |                             |                  |                         |       |
| SB-08      |                        |                             |                  |                         |       |
| SB-09      |                        |                             |                  |                         |       |
| SB-10      |                        |                             |                  |                         |       |
| SB-11      |                        |                             |                  |                         |       |
| SB-12      |                        |                             |                  |                         |       |
