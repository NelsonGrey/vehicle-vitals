# R1 Export Parity Report

Generated: 2026-05-07T17:49:23Z
Fixture: r1-shared-fixture (3 entries — Toyota Camry 2023, VIN TEST-VIN-2026-0001)

## Inputs

Reference artifacts from automated parity validation runs:

- Web CSV: artifacts/smoke/r1-export-web-csv-2026-05-06T21-34-24-232Z.csv
- Mobile CSV: artifacts/smoke/r1-export-mobile-csv-2026-05-06T21-34-24-232Z.csv
- Web PDF: artifacts/smoke/r1-export-web-pdf-2026-05-06T21-34-24-391Z.pdf
- Mobile PDF: artifacts/smoke/r1-export-mobile-pdf-2026-05-06T21-34-24-391Z.pdf

## Vehicle Context

| Field | Value              |
| ----- | ------------------ |
| VIN   | TEST-VIN-2026-0001 |
| Year  | 2023               |
| Make  | Toyota             |
| Model | Camry              |

## CSV Comparison

### Header Parity

- **Status**: ✅ Pass
- **Web headers**: Date, Title, Cost, Mileage, Notes
- **Mobile headers**: Date, Title, Cost, Mileage, Notes

### Row Count Parity

- **Status**: ✅ Pass
- **Web rows**: 3
- **Mobile rows**: 3

### Data Value Parity

- **Status**: ✅ Pass (spot-check across all 3 rows)

### Differences Accepted

- None. Both exports produce identical CSV structure and fixture data values.

## PDF Comparison

### Artifact Generation

- Web PDF generated: ✅ (7,978 bytes)
- Mobile PDF generated: ✅ (7,055 bytes)

### Core Section Parity

- Header present in both: ✅
- VIN and vehicle context present in both: ✅
- Maintenance table present in both: ✅

### Required Field Parity

- Shared fields present in both exports: Date, Title, Cost, Notes ✅
- Known intentional difference: Mileage column appears in web export only ✅ (documented, accepted)

### Differences Accepted

- Web PDF includes Mileage column; mobile PDF omits it. This is an intentional platform-level difference, accepted per product decision.
- Web PDF is ~13% larger in bytes due to Mileage column content; readability and structure are equivalent.

### Assessment

- PDF structural parity for required shared fields: ✅ PASS
- Automated validation completed: 2026-05-07

## Signoff

- QA owner: Automated R1 Gate 3 validation pipeline
- Date: 2026-05-07
- Result: ✅ Pass (automated CSV + PDF structural parity)
- Notes: All automated parity checks passed. Manual visual QA (readability, spacing, styling on real device renders) is recommended before final production sign-off but does not block R1 gate closure given full structural parity confirmation.
