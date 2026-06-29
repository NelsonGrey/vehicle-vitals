# Vehicle Health Dashboard Spec

Last updated: June 12, 2026
Status: Proposed for implementation

## Why this exists

Vehicle Vitals currently proves record-keeping value, but it does not yet make subscription value visually obvious within the first few seconds of landing on the dashboard.

The new `Vehicle Health` dashboard shifts the product from:

- record archive
- reminder list
- maintenance history viewer

to:

- maintenance decision support
- remaining-life forecasting
- upcoming spend visibility
- confidence-scored health estimation

This is the premium surface that should create immediate upgrade pressure.

## Product goal

Answer these questions instantly for each vehicle:

- What is likely to need attention next?
- How much life is left on common wear items?
- What is the expected maintenance cost in the next 3, 12, and 36 months?
- How confident is the system in those estimates?

## Position in current product

Current repository reality:

- Web `Home` focuses on garage list, alerts, and ownership cost summaries.
- Web `UpcomingTasks` already estimates due items from mileage schedules.
- iOS `Analytics` is primarily usage and maintenance totals, not vehicle health forecasting.

This spec adds a new shared forecasting layer that can drive:

- web dashboard cards
- iOS health screen
- paywall/upgrade prompts
- future OBD-backed enrichment when available

## Telemetry later

Do not make dongle or telemetry access a prerequisite for the first release.

Later enrichment path:

- optional `OBD-II dongle` integration
- optional OEM connected-car integrations
- optional telemetry-assisted confidence boosts

Phase-1 rule:

- the dashboard must be valuable from `records + mileage + service history` alone
- telemetry should improve confidence and freshness, not define the core product

## Core concept

Each vehicle gets a computed `health snapshot` made of:

- `overallHealthScore` from 0-100
- `componentLife` estimates for major service categories
- `forecastTimeline` for likely due windows
- `projectedSpend` for multiple planning horizons
- `confidenceScore` per component and for the overall vehicle
- `recommendedActions` ranked by urgency

This is not diagnostic truth. It is a forecast built from recorded history, mileage, time, and baseline service intervals.

## Key components to forecast

Phase 1 should cover the highest-value, most understandable items:

- oil change
- tire rotation
- tires
- front brakes
- rear brakes
- battery
- windshield wipers
- engine air filter
- cabin air filter

Phase 2 can add:

- spark plugs
- coolant service
- transmission service
- brake fluid
- serpentine belt

## Forecasting model

### Inputs

- current vehicle mileage
- initial mileage entered at setup
- manual maintenance entries
- extracted invoice/service data where available
- service dates
- service costs
- service type normalization
- user-stated driving profile if provided later
- manufacturer/default interval baselines

### Derived values

- `estimatedMilesPerMonth`
- `estimatedMilesPerDay`
- `lastServiceMileageByType`
- `lastServiceDateByType`
- `serviceCadenceByType`
- `costRangeByType`

### Baseline interval examples

Initial defaults should be transparent and editable:

- oil change: `5,000 miles / 6 months`
- tire rotation: `5,000 to 7,500 miles`
- tires: `40,000 to 60,000 miles`
- front brakes: `30,000 to 50,000 miles`
- rear brakes: `40,000 to 70,000 miles`
- battery: `36 to 60 months`
- wipers: `6 to 12 months`

These are starter assumptions only. They should be replaced or tuned by:

- detected service history
- user override
- OEM schedule integration later
- OBD/telematics signals later

### Remaining life calculation

Each component gets:

- `remainingMiles`
- `remainingDays`
- `remainingLifePercent`
- `status`

Suggested calculation order:

1. Determine the best available anchor event for the component.
2. Determine expected interval using user history first, default interval second.
3. Compute elapsed mileage and elapsed time since the anchor event.
4. Use the more conservative of mileage-based or time-based remaining life.
5. Assign status:
   - `good`
   - `watch`
   - `service_soon`
   - `overdue`

Example:

- Oil change at 52,000 miles on January 10, 2026
- Current mileage 55,100 on June 12, 2026
- Default interval 5,000 miles / 6 months

Remaining life:

- mileage remaining: `1,900`
- time remaining: about `28 days`
- controlling factor: time
- status: `service_soon`

### Confidence scoring

Every estimate must carry confidence so the UI does not overclaim.

Confidence inputs:

- explicit service record exists
- invoice extraction confidence
- presence of exact mileage at service
- repeated history for same service type
- consistency of odometer history
- age of last known record
- whether result is interval-default-only

Confidence bands:

- `high`: exact service event plus usable mileage history
- `medium`: partial history or inferred cadence
- `low`: default interval with weak or missing service evidence

### Overall vehicle health score

The top score should be simple and legible, not fake precision.

Recommended weighting:

- oil and fluid routine health: `20%`
- tires and rotation: `20%`
- brakes: `20%`
- battery and starting system proxy: `15%`
- filters and seasonal wear items: `10%`
- upcoming overdue risk penalty: `15%`

Rules:

- cap score if any component is `overdue`
- degrade score if confidence is low across most components
- show `Estimated` label whenever confidence mix is weak

## Dashboard UX

### Web dashboard

Add a new top-priority section above or beside current garage summaries.

Recommended structure:

1. `Vehicle Health Hero`
   - selected vehicle
   - overall health score
   - confidence badge
   - next likely service
   - estimated 90-day spend

2. `Component Lifespan Grid`
   - 6 bold cards
   - radial or horizontal lifespan meters
   - remaining miles and estimated date
   - status color and confidence

3. `Forecast Timeline`
   - next 3, 12, or 36 months
   - grouped by `soon`, `later`, `watch`

4. `Budget Outlook`
   - low/high spend estimate
   - likely service bundle explanation

5. `Why this estimate`
   - concise explanation of which records and assumptions were used

6. `Upgrade Surface`
   - Free: locked advanced forecast cards
   - Pro: 12-month horizon unlocked
   - Premium: 36-month horizon and portfolio summary

### iOS dashboard

Replace the current analytics emphasis with a health-first screen.

Recommended structure:

- top score card with bold number and urgency chip
- swipeable component cards
- “Needs attention” rail
- next-service forecast sheet
- confidence explainer sheet

iOS should feel more visual than tabular:

- large rings or segmented bars
- fewer metrics per screen
- strong red/amber/green state hierarchy

## Monetization design

### Free

- vehicle health preview for one vehicle
- 3 component cards visible
- no long-range forecast
- no spend outlook detail
- low-detail explanations

### Pro

- full 12-month vehicle health forecast
- all phase-1 components
- next-service budget range
- maintenance bundling suggestions

### Premium

- 36-month forecast
- garage-wide health rollup
- multi-vehicle ranking by urgency
- richer confidence/explanation layer
- future OBD-assisted scoring when available

## Data model additions

Shared normalized types should be added in the shared package so both clients render the same forecast.

Suggested shape:

```ts
type HealthStatus = 'good' | 'watch' | 'service_soon' | 'overdue';
type ConfidenceBand = 'high' | 'medium' | 'low';

interface VehicleHealthComponentEstimate {
  componentId: string;
  label: string;
  status: HealthStatus;
  confidenceBand: ConfidenceBand;
  confidenceScore: number;
  remainingLifePercent: number | null;
  remainingMiles: number | null;
  remainingDays: number | null;
  estimatedDueMileage: number | null;
  estimatedDueDate: string | null;
  estimatedCostLow: number | null;
  estimatedCostHigh: number | null;
  anchorSource: 'record' | 'invoice' | 'inferred' | 'default';
  anchorRecordId?: string;
  explanation: string[];
}

interface VehicleHealthSnapshot {
  vin: string;
  generatedAt: string;
  overallHealthScore: number;
  overallConfidenceScore: number;
  overallConfidenceBand: ConfidenceBand;
  nextLikelyService: string | null;
  estimatedSpend90dLow: number | null;
  estimatedSpend90dHigh: number | null;
  estimatedSpend12mLow: number | null;
  estimatedSpend12mHigh: number | null;
  estimatedSpend36mLow: number | null;
  estimatedSpend36mHigh: number | null;
  components: VehicleHealthComponentEstimate[];
}
```

Storage options:

- compute on read for initial rollout
- optionally cache under `users/{uid}/vehicles/{vin}/health/current`

## Normalization requirements

The forecast quality depends on consistent service typing.

Before the dashboard launches, maintenance entries should normalize to shared service categories such as:

- `oil_change`
- `tire_rotation`
- `tire_replacement`
- `front_brake_service`
- `rear_brake_service`
- `battery_replacement`
- `wiper_replacement`

Invoice extraction should map source text into these categories with a confidence score.

## Empty-state and low-data behavior

The feature must still work for users with sparse history.

Low-data mode should:

- show fewer components
- label estimates as baseline-based
- explain what additional records improve accuracy
- encourage invoice upload or manual service entry
- encourage users to keep mileage and service records current after initial setup

Example messaging:

- `Add your last oil change record to improve this estimate`
- `We can estimate tire life better once you log the install mileage`
- `Keep your odometer and recent service history up to date so the forecast stays accurate`

## Technical implementation plan

### Phase 1: shared forecasting engine

- add shared health score types
- add service-type normalization helpers
- add forecast calculator fed by maintenance history and current mileage
- add confidence scoring
- add unit coverage for core scenarios

### Phase 2: web dashboard

- add `VehicleHealthHero`
- add `ComponentLifeCard`
- add `ForecastTimeline`
- add paywall states based on feature flags

### Phase 3: iOS health screen

- replace or reframe current analytics entry point
- add health summary cards
- add premium gating states

### Phase 4: enrichment

- improve invoice extraction mapping
- use manual/provider/OEM schedule data
- add optional OBD-assisted inputs

## Acceptance criteria

The first release is successful when:

- a vehicle with only setup mileage and one oil-change record renders a usable forecast
- the user can see component remaining-life estimates without opening records
- Free users clearly see locked value without the UI feeling broken
- Pro/Premium users get a visibly stronger dashboard than Free
- confidence labels are always present when data quality is weak
- forecast explanations are understandable in plain language

## Success metrics

Track:

- dashboard view rate
- forecast card interaction rate
- upgrade conversion from locked forecast states
- percentage of vehicles with at least 3 populated component estimates
- percentage of estimates backed by record/invoice data vs defaults
- retention delta for users who view health dashboard within first 7 days

## Key product rule

Do not present this feature as diagnostics.

Approved framing:

- `estimated remaining life`
- `forecast`
- `predicted due window`
- `based on your records and mileage`

Disallowed framing:

- `actual part condition`
- `guaranteed remaining life`
- `diagnostic result`
- `real-time health` unless OBD/telematics data actually exists
