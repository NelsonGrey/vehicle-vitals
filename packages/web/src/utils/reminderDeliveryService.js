const resolveReminderEndpoint = () => {
  const explicit = import.meta.env.VITE_FUNCTIONS_BASE_URL;
  if (explicit) {
    return `${explicit.replace(/\/$/, '')}/sendMaintenanceReminder`;
  }

  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('Unable to resolve reminder endpoint');
  }

  return `https://us-central1-${projectId}.cloudfunctions.net/sendMaintenanceReminder`;
};

export async function sendReminderDeliveryEmail({
  email,
  vehicle,
  maintenanceItems,
}) {
  const endpoint = resolveReminderEndpoint();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, vehicle, maintenanceItems }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.success !== true) {
    throw new Error(data?.error || `Reminder HTTP error ${response.status}`);
  }

  return data;
}
