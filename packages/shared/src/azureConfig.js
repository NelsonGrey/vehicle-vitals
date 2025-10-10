// -----------------------------
// File: shared/azureConfig.js

// MSAL for Azure AD B2C Authentication
import { PublicClientApplication } from '@azure/msal-browser';

// Azure AD B2C Configuration
const msalConfig = {
  auth: {
    clientId: 'YOUR_AZURE_AD_B2C_CLIENT_ID',
    authority: 'https://YOUR_TENANT_NAME.b2clogin.com/YOUR_TENANT_NAME.onmicrosoft.com/B2C_1_signupsignin1',
    redirectUri: 'http://localhost:3000', // adjust as needed
  }
};

export const msalInstance = new PublicClientApplication(msalConfig);

// Example function for Cosmos DB (backend API endpoint)
export async function getDataFromCosmosDB() {
  const response = await fetch('/api/data'); // Your API endpoint that talks to Cosmos DB
  if (!response.ok) throw new Error('Failed to fetch data');
  return response.json();
}

// Example function for sending push notifications (backend API endpoint)
export async function sendNotification(payload) {
  const response = await fetch('/api/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to send notification');
  return response.json();
}
