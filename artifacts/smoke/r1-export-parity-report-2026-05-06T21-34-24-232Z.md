# R1 Export Parity Report

Generated: 2026-05-06T21:34:24.282Z
Fixture: r1-shared-fixture (3 entries)

## Inputs

- Web CSV: r1-export-web-csv-2026-05-06T21-34-24-232Z.csv
- Mobile CSV: r1-export-mobile-csv-2026-05-06T21-34-24-232Z.csv

## Vehicle Context

| Field | Value |
| --- | --- |
| VIN | TEST-VIN-2026-0001 |
| Year | 2023 |
| Make | Toyota |
| Model | Camry |

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
- **Status**: ✅ Pass (sample spot-check)

## Issues Found

- None

## Overall Parity Assessment

- CSV Structure Parity: ✅ PASS
- Differences Accepted: TBD (pending manual review)

## PDF Comparison

*(Requires manual inspection of generated PDFs)*

- Web PDF: artifacts/smoke/r1-export-web-pdf-2026-05-06T21-34-24-232Z.pdf
- Mobile PDF: artifacts/smoke/r1-export-mobile-pdf-2026-05-06T21-34-24-232Z.pdf

## Signoff

- QA owner: TBD
- Date: TBD
- Result: TBD (Pass/Fail)
- Notes: Manual validation of PDF structure and styling still required. CSV parity is automated.

## Test Fixture Reference

```json
{
  "vehicle": {
    "vin": "TEST-VIN-2026-0001",
    "year": 2023,
    "make": "Toyota",
    "model": "Camry"
  },
  "maintenanceEntries": [
    {
      "id": "entry-001",
      "date": "2026-01-15T00:00:00.000Z",
      "title": "Oil Change",
      "cost": 65.99,
      "mileage": 24500,
      "notes": "Synthetic oil change at 24k miles"
    },
    {
      "id": "entry-002",
      "date": "2026-02-28T00:00:00.000Z",
      "title": "Tire Rotation",
      "cost": 49.99,
      "mileage": 25100,
      "notes": "Rotated all four tires"
    },
    {
      "id": "entry-003",
      "date": "2026-04-10T00:00:00.000Z",
      "title": "Air Filter Replacement",
      "cost": 34.5,
      "mileage": 26200,
      "notes": "Engine air filter replaced"
    }
  ]
}
```
