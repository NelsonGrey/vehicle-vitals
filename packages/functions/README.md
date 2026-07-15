# @vehicle-vitals/functions

Firebase Cloud Functions for Vehicle-Vitals backend services.

## Features

- 🔍 **VIN Lookup**: Look up vehicle identification numbers using NHTSA VPIC API
- 📧 **Maintenance Reminders**: Automated email reminders for upcoming vehicle maintenance
- ⏰ **Scheduled Tasks**: Daily checks for maintenance due dates
- 🔧 **Firestore Integration**: CRUD operations for vehicle and maintenance data

## Functions

### `vinLookup`

HTTP endpoint that looks up VINs using the NHTSA Vehicle Information API.

**Endpoint**: `POST /vinLookup`
**Request Body**:

```json
{
  "vin": "1HGBH41JXMN109186"
}
```

**Response**:

```json
{
  "success": true,
  "vehicle": {
    "vin": "1HGBH41JXMN109186",
    "make": "HONDA",
    "model": "ACCORD",
    "year": "2002",
    "bodyClass": "Sedan/Saloon",
    "engineType": "2.3L L4 DOHC 16V",
    "fuelType": "Gasoline",
    "driveType": "FWD",
    "transmissionStyle": "Automatic",
    "trim": "EX",
    "vehicleType": "PASSENGER VEHICLE"
  }
}
```

### `sendMaintenanceReminder`

HTTP endpoint for sending maintenance reminder emails.

**Endpoint**: `POST /sendMaintenanceReminder`
**Request Body**:

```json
{
  "email": "user@example.com",
  "vehicle": {
    "make": "Honda",
    "model": "Accord",
    "year": 2002,
    "vin": "1HGBH41JXMN109186"
  },
  "maintenanceItems": [
    {
      "title": "Oil Change",
      "dueDate": "2024-02-15",
      "type": "preventive"
    }
  ]
}
```

### `checkMaintenanceReminders`

Scheduled function that runs daily to check for upcoming maintenance and send reminders.

**Schedule**: Every day at 9:00 AM
**Logic**: Checks vehicles for maintenance due within 30 days and sends email reminders

## Development

```bash
npm run build      # Compile TypeScript
npm run serve      # Start Firebase emulators
npm run shell      # Interactive shell for testing
npm run deploy     # Deploy to Firebase
npm run logs       # View function logs
```

## Project Structure

```
src/
├── index.ts       # Main functions file
└── types.ts       # TypeScript interfaces (future)

lib/               # Compiled JavaScript output
```

## Dependencies

- **firebase-admin**: Firebase Admin SDK for server-side operations
- **firebase-functions**: Cloud Functions runtime
- **typescript**: TypeScript compilation

## Environment

- **Node.js**: Version 22
- **Firebase**: Functions runtime
- **NHTSA VPIC API**: For VIN lookup (no API key required)

### Integration Runtime Flags

Email delivery:

```bash
EMAIL_PROVIDER=log|workspace
WORKSPACE_SMTP_USER=no-reply@yourdomain.com
WORKSPACE_SMTP_APP_PASSWORD=...
```

`workspace` sends via Google Workspace's Gmail SMTP (smtp.gmail.com:465)
using an app password generated for `WORKSPACE_SMTP_USER`. That account
needs 2-Step Verification enabled to generate an app password.

Provider flags:

```bash
MANUALS_ENABLED=true|false
MANUALS_PROVIDER=manuals_primary|none
WARRANTY_ENABLED=true|false
WARRANTY_PROVIDER=warranty_primary|none
MAINTENANCE_PLAN_ENABLED=true|false
SCHEDULE_PROVIDER=schedule_primary|none
CALENDAR_ENABLED=true|false
CALENDAR_PROVIDER=calendar_primary|none
```

Auth and rate limiting:

```bash
INTEGRATION_AUTH_REQUIRED=true|false
INTEGRATION_RATE_LIMIT_ENABLED=true|false
INTEGRATION_RATE_LIMIT_MAX=60
INTEGRATION_RATE_LIMIT_WINDOW_MS=60000
INTEGRATION_CACHE_ENABLED=true|false
INTEGRATION_CACHE_TTL_MS=86400000
```

Guard behavior is implemented in `src/request.guards.ts` and applied to
integration endpoints (`getOwnerManuals`, `getWarrantySummary`,
`getMaintenancePlan`, `createCalendarEvent`).

Calendar trigger entry points:

- HTTP fallback endpoint: `createCalendarEvent`
- Callable endpoint: `createCalendarEventCallable`

Integration cache behavior (optional):

- Enable with `INTEGRATION_CACHE_ENABLED=true`
- TTL with `INTEGRATION_CACHE_TTL_MS`
- Cached docs are stored under
  `users/{uid}/vehicles/{vin}/integrations/{manuals|warranty}/current`

Premium verification flags:

```bash
PREMIUM_VERIFICATION_REQUIRED=true|false
PREMIUM_UNKNOWN_SOURCE_UNVERIFIED=true|false
APPLE_SHARED_SECRET=...
GOOGLE_PLAY_PACKAGE_NAME=com.example.app
GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GOOGLE_PLAY_ACCESS_TOKEN=... # optional test/staging override
```

Premium verification behavior:

- Entry point: `verifyPremiumPurchase` callable in `src/index.ts`
- Entitlement read API: `getPremiumEntitlement` callable
- Provider implementation: `src/premium.provider.ts`
- Receipt replay protection: `premiumReceipts/{receiptHash}`

Accepted purchase source values:

- App Store canonical: `app_store`
- App Store aliases: `apple_app_store`, `appstore`
- Play Store canonical: `play_store`
- Play Store aliases: `google_play`, `playstore`

Recommended production mode:

- `PREMIUM_VERIFICATION_REQUIRED=true`
- `PREMIUM_UNKNOWN_SOURCE_UNVERIFIED=true`

## Deployment

Functions are automatically deployed via CI/CD pipeline. For manual deployment:

```bash
npm run deploy
```

## Testing

```bash
# Start emulators
npm run serve

# Test functions interactively
npm run shell
```

## Security

- CORS enabled for web app integration
- Input validation for all endpoints
- Firebase Authentication enforced for integration endpoints via ID token verification
- Per-endpoint rate limiting enforced via `src/request.guards.ts`
