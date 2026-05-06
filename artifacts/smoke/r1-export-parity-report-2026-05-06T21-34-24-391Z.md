# R1 Export Parity Report

Generated: 2026-05-06T21:34:24.415Z
Fixture: r1-shared-fixture (3 entries)

## Inputs

- Web PDF: r1-export-web-pdf-2026-05-06T21-34-24-391Z.pdf
- Mobile PDF: r1-export-mobile-pdf-2026-05-06T21-34-24-391Z.pdf

## Vehicle Context

| Field | Value |
| --- | --- |
| VIN | TEST-VIN-2026-0001 |
| Year | 2023 |
| Make | Toyota |
| Model | Camry |

## PDF Comparison

### Artifact Generation
- Web PDF generated: ✅
- Mobile PDF generated: ✅
- Web file size: 7978 bytes
- Mobile file size: 7055 bytes

### Core Section Parity
- Header present in both: ✅
- VIN and Vehicle context present in both: ✅
- Maintenance table present in both: ✅

### Required Field Parity
- Shared fields present in both exports: Date, Title, Cost, Notes ✅
- Known intentional difference: Mileage column appears in web export only ✅

### Assessment
- PDF structural parity for required fields: ✅ PASS
- Manual visual QA signoff still required: ⚠️ Pending

## Signoff

- QA owner: TODO
- Date: TODO
- Result: TODO (Pass/Fail)
- Notes: Confirm visual styling and readability on real exported files from web and mobile UI flows.
