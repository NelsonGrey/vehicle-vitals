# @vehicle-vitals/functions

Firebase Cloud Functions for Vehicle Vitals backend services.

## Features

- 🔍 **VIN Decoding**: Decode vehicle identification numbers using NHTSA VPIC API
- 📧 **Maintenance Reminders**: Automated email reminders for upcoming vehicle maintenance
- ⏰ **Scheduled Tasks**: Daily checks for maintenance due dates
- 🔧 **Firestore Integration**: CRUD operations for vehicle and maintenance data

## Functions

### `decodeVIN`

HTTP endpoint that decodes VINs using the NHTSA Vehicle Information API.

**Endpoint**: `POST /decodeVIN`
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
    "vehicleType": "PASSENGER CAR"
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
- **NHTSA VPIC API**: For VIN decoding (no API key required)

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
- Firebase Authentication integration (planned)
- Rate limiting via Firebase Functions configuration</content>
  <parameter name="filePath">/Users/marknelson/Circus/Repositories/vehicle-vitals/packages/functions/README.md
