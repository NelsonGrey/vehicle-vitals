import * as logger from "firebase-functions/logger";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

type EmailProvider = "log" | "sendgrid";

/**
 * Resolve outbound email provider from environment.
 * @return {EmailProvider} Active provider name
 */
function getEmailProvider(): EmailProvider {
  const raw = (process.env.EMAIL_PROVIDER || "log").trim().toLowerCase();
  return raw === "sendgrid" ? "sendgrid" : "log";
}

/**
 * Send an email using SendGrid v3 Mail Send API.
 * @param {EmailMessage} message Email payload
 * @return {Promise<void>} Resolves on successful submission
 */
async function sendWithSendGrid(message: EmailMessage): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    throw new Error(
      "Missing SENDGRID_API_KEY or SENDGRID_FROM_EMAIL for sendgrid provider"
    );
  }

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{to: [{email: message.to}]}],
      from: {email: fromEmail},
      subject: message.subject,
      content: [
        {type: "text/plain", value: message.text},
        {type: "text/html", value: message.html},
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`SendGrid API error ${response.status}: ${body}`);
  }
}

/**
 * Send an email using the configured provider.
 * @param {EmailMessage} message Email payload
 * @return {Promise<void>} Resolves when delivery is attempted
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  const provider = getEmailProvider();

  if (provider === "sendgrid") {
    await sendWithSendGrid(message);
    logger.info("Reminder email sent via sendgrid", {
      to: message.to,
      subject: message.subject,
    });
    return;
  }

  logger.info("EMAIL_PROVIDER=log; email send simulated", {
    to: message.to,
    subject: message.subject,
    previewText: message.text.slice(0, 180),
  });
}
