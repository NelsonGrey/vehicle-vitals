# Vehicle-Vitals - Maintenance User Cases and Types

**Purpose**: Define the supported maintenance users, record types, and feature expectations so the maintenance workflow stays complete across web, mobile, exports, and backend storage.

---

## User Types

### 1. Individual owner

Owns one or more vehicles and logs all maintenance personally.

Needs:

- Fast entry for DIY work and simple receipts
- Ability to mark a record as self-service
- Ability to store parts-only receipts when no labor invoice exists

### 2. DIY owner with mixed records

Performs some work personally and uses mechanics for larger repairs.

Needs:

- Clear distinction between self-service and mechanic work
- Consistent history across both types of entries
- Exportable records for taxes, resale, or warranty review

### 3. Mechanic-serviced owner

Primarily relies on a shop, dealer, or mobile mechanic.

Needs:

- Shop name or provider name on the record
- Parts-and-labor receipt tracking
- Support for document uploads and AI extraction where available

### 4. Business-maintained fleet user

Represents company-owned vehicles maintained by an internal team or fleet vendor.

Needs:

- Record type that clearly marks business-maintained work
- Support for parts-only or parts-plus-labor accounting
- Exportable records for reporting and audit workflows

### 5. Mobile-first user

Often captures maintenance at the vehicle or repair location.

Needs:

- Simple form controls on mobile
- Edit support for correcting entries later
- Clear labels that make record type obvious at a glance

### 6. Web-first user

Prefer to batch-enter, review, and export records on a desktop browser.

Needs:

- Consistent form fields between web and mobile
- Easy review of how the work was completed
- Export views that preserve the same metadata

---

## Supported Maintenance Cases

### Self-service maintenance

Use when the owner does the work and there is no outside mechanic invoice.

Examples:

- Oil change performed at home
- Brake pad replacement completed by the owner
- Seasonal tire swap done without a service shop

Required behavior:

- Mark the record as self-service
- Allow notes and receipts for purchased parts
- Allow a total cost even if it only reflects parts

### Parts-only receipt

Use when the user has proof of purchased parts but no labor invoice.

Examples:

- Parts purchased for a DIY repair
- Warranty-covered labor where only parts were billed
- Fleet stocking or internal maintenance supply purchase

Required behavior:

- Mark the receipt coverage as parts only
- Allow the cost to represent the parts total
- Keep the record visible in timelines and exports

### Mechanic or shop service

Use when a third-party mechanic, dealer, or service center performs the work.

Examples:

- Scheduled oil change
- Brake service with labor line items
- Diagnostic and repair invoice from a shop

Required behavior:

- Mark the record as mechanic-performed
- Preserve provider/shop information when available
- Support parts-and-labor as the default receipt type

### Business-maintained fleet work

Use when a company or fleet team maintains the vehicle.

Examples:

- In-house maintenance bay service
- Fleet vendor service with consolidated billing
- Preventive maintenance performed by a business operator

Required behavior:

- Mark the record as business-maintained
- Support standardized exports for accounting and audits
- Keep the workflow compatible with both web and mobile entry

### Mixed-history vehicle

Use when the same vehicle has a combination of DIY, mechanic, and business-maintained entries.

Required behavior:

- Allow every record to carry its own type independently
- Avoid forcing a vehicle-level default that overwrites history
- Keep the timeline readable even when the service mix changes over time

### No-labor documentation case

Use when there is no invoice for labor because the owner did the work, the work was free, or labor was handled off-book.

Required behavior:

- Allow entry without a labor invoice
- Preserve notes explaining what happened
- Keep the record valid for resale, warranty, or personal tracking

---

## Feature Expectations

The maintenance solution should continue to provide:

- A shared maintenance schema used by web, mobile, exports, and future backend features
- Clear UI wording for who did the work and what the receipt covers
- Export formats that preserve the maintenance metadata
- Backward compatibility with existing records that only have title, notes, cost, and date
- Room for future additions such as labor breakdowns, service locations, or reimbursement flags

---

## Documentation Rule

When adding a new maintenance feature, check this matrix first:

- Does it affect a self-service owner?
- Does it affect a mechanic-serviced record?
- Does it affect a business-maintained fleet?
- Does it work when only parts are documented?
- Does it still work when no labor invoice exists?

If the answer to any of those is yes, the shared schema, both clients, and exports should be updated together.
