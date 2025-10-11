import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import {onSchedule} from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});

setGlobalOptions({maxInstances: 10});

// VIN decoding function
export const decodeVIN = onRequest({cors: true}, async (request, response) => {
  try {
    // Only allow POST requests
    if (request.method !== "POST") {
      response.status(405).json({error: "Method not allowed"});
      return;
    }

    const {vin} = request.body;

    if (!vin || typeof vin !== "string" || vin.length !== 17) {
      response.status(400).json({error: "Valid 17-character VIN required"});
      return;
    }

    logger.info(`Decoding VIN: ${vin.substring(0, 8)}...`);

    // Call NHTSA VPIC API
    const nhtsaUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${encodeURIComponent(vin)}?format=json`;
    const nhtsaResponse = await fetch(nhtsaUrl);

    if (!nhtsaResponse.ok) {
      throw new Error(`NHTSA API error: ${nhtsaResponse.status}`);
    }

    const data = await nhtsaResponse.json();
    const results = data?.Results || [];

    // Extract relevant vehicle information
    const sanitize = (value: string | undefined) => {
      const s = (value ?? "").toString().trim();
      if (!s) return "";
      const bad = new Set([
        "0", "NOT APPLICABLE", "NULL", "N/A", "NONE", "UNKNOWN",
      ]);
      return bad.has(s.toUpperCase()) ? "" : s;
    };

    const getVal = (key: string) =>
      sanitize(results.find((r: { Variable: string; Value: string }) =>
        r.Variable === key)?.Value);

    const vehicle = {
      vin: vin.toUpperCase(),
      make: getVal("Make"),
      model: getVal("Model"),
      year: getVal("Model Year"),
      bodyClass: getVal("Body Class"),
      engineType: getVal("Engine Type"),
      fuelType: getVal("Fuel Type - Primary"),
      driveType: getVal("Drive Type"),
      transmissionStyle: getVal("Transmission Style"),
      trim: getVal("Trim"),
      vehicleType: getVal("Vehicle Type"),
    };

    const vehicleDesc = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
    logger.info(`Successfully decoded VIN for ${vehicleDesc}`);

    response.json({
      success: true,
      vehicle,
    });
  } catch (error) {
    logger.error("VIN decoding error:", error);
    response.status(500).json({
      success: false,
      error: "Failed to decode VIN",
    });
  }
});

// Email reminder function
export const sendMaintenanceReminder = onRequest({cors: true}, async (request, response) => {
  try {
    // Only allow POST requests
    if (request.method !== "POST") {
      response.status(405).json({error: "Method not allowed"});
      return;
    }

    const {email, vehicle, maintenanceItems} = request.body;

    if (!email || !vehicle || !maintenanceItems || !Array.isArray(maintenanceItems)) {
      response.status(400).json({error: "Missing required fields: email, vehicle, maintenanceItems"});
      return;
    }

    logger.info(`Sending maintenance reminder to ${email} for ${vehicle.make} ${vehicle.model}`);

    // For now, we'll log the email content. In production, integrate with SendGrid or similar
    const emailContent = {
      to: email,
      subject: `Maintenance Reminder: ${vehicle.make} ${vehicle.model} (${vehicle.year})`,
      html: `
        <h2>Vehicle Maintenance Reminder</h2>
        <p>Your <strong>${vehicle.year} ${vehicle.make} ${vehicle.model}</strong> (VIN: ${vehicle.vin}) is due for maintenance:</p>
        <ul>
          ${maintenanceItems.map(item => `<li><strong>${item.title}</strong> - Due: ${item.dueDate}</li>`).join('')}
        </ul>
        <p>Please schedule these services soon to keep your vehicle in optimal condition.</p>
        <br>
        <p>Vehicle Vitals Team</p>
      `,
      text: `
        Vehicle Maintenance Reminder

        Your ${vehicle.year} ${vehicle.make} ${vehicle.model} (VIN: ${vehicle.vin}) is due for maintenance:

        ${maintenanceItems.map(item => `- ${item.title} - Due: ${item.dueDate}`).join('\n')}

        Please schedule these services soon to keep your vehicle in optimal condition.

        Vehicle Vitals Team
      `
    };

    // TODO: Integrate with SendGrid or other email service
    logger.info("Email content prepared:", emailContent);

    // For now, just return success
    response.json({
      success: true,
      message: "Reminder email prepared (integration pending)",
    });
  } catch (error) {
    logger.error("Email reminder error:", error);
    response.status(500).json({
      success: false,
      error: "Failed to send reminder email",
    });
  }
});

// Scheduled function to check for upcoming maintenance (runs daily)
export const checkMaintenanceReminders = onSchedule("0 9 * * *", async (event) => {
  logger.info("Checking for maintenance reminders...");

  try {
    const db = admin.firestore();
    const usersRef = db.collection('users');

    // Get all users
    const usersSnapshot = await usersRef.get();

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      // Check if user has email reminders enabled (default to true if not set)
      const emailRemindersEnabled = userData.emailRemindersEnabled !== false;

      if (!emailRemindersEnabled || !userData.email) {
        continue;
      }

      // Get user's vehicles
      const vehiclesRef = usersRef.doc(userId).collection('vehicles');
      const vehiclesSnapshot = await vehiclesRef.get();

      for (const vehicleDoc of vehiclesSnapshot.docs) {
        const vehicle = { id: vehicleDoc.id, ...vehicleDoc.data() };

        // Check for upcoming maintenance (within 30 days)
        const upcomingMaintenance = await getUpcomingMaintenance(vehicle, 30);

        if (upcomingMaintenance.length > 0) {
          // Send reminder email
          await sendReminderEmail(userData.email, vehicle, upcomingMaintenance);
        }
      }
    }

    logger.info("Maintenance reminder check completed");
  } catch (error) {
    logger.error("Error checking maintenance reminders:", error);
  }
});

// Helper function to get upcoming maintenance items
async function getUpcomingMaintenance(vehicle: any, daysAhead = 30) {
  const db = admin.firestore();
  const maintenanceRef = db.collection(`users/${vehicle.uid || 'unknown'}/vehicles/${vehicle.vin}/maintenance`);

  // This is a simplified version - in practice, you'd need manufacturer schedules
  // For now, we'll check existing maintenance entries and look for patterns
  const maintenanceSnapshot = await maintenanceRef.get();

  const upcomingItems = [];
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + daysAhead);

  // Simple logic: if no maintenance in last 6 months, suggest oil change
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 6);

  let hasRecentOilChange = false;
  maintenanceSnapshot.forEach(doc => {
    const entry = doc.data();
    const entryDate = entry.date?.toDate?.() || new Date(entry.date);

    if (entry.title?.toLowerCase().includes('oil') && entryDate > sixMonthsAgo) {
      hasRecentOilChange = true;
    }
  });

  if (!hasRecentOilChange) {
    upcomingItems.push({
      title: "Oil Change",
      dueDate: "Within 1 month",
      type: "preventive"
    });
  }

  return upcomingItems;
}

// Helper function to send reminder email (placeholder)
async function sendReminderEmail(email: string, vehicle: any, maintenanceItems: any[]) {
  // This would integrate with SendGrid, Mailgun, etc.
  logger.info(`Would send reminder email to ${email} for ${vehicle.make} ${vehicle.model}:`, maintenanceItems);
}
