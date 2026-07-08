import * as logger from "firebase-functions/logger";
import * as nodemailer from "nodemailer";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

type EmailProvider = "log" | "workspace";

/**
 * Resolve outbound email provider from environment.
 * @return {EmailProvider} Active provider name
 */
function getEmailProvider(): EmailProvider {
  const raw = (process.env.EMAIL_PROVIDER || "log").trim().toLowerCase();
  return raw === "workspace" ? "workspace" : "log";
}

/**
 * Send an email through Google Workspace's Gmail SMTP using an
 * account app password (smtp.gmail.com, port 465).
 * @param {EmailMessage} message Email payload
 * @return {Promise<void>} Resolves on successful submission
 */
async function sendWithWorkspace(message: EmailMessage): Promise<void> {
  const user = process.env.WORKSPACE_SMTP_USER;
  const pass = process.env.WORKSPACE_SMTP_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error(
      "Missing WORKSPACE_SMTP_USER or WORKSPACE_SMTP_APP_PASSWORD " +
      "for workspace provider"
    );
  }

  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {user, pass},
  });

  await transport.sendMail({
    from: user,
    to: message.to,
    replyTo: message.replyTo,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}

/**
 * Send an email using the configured provider.
 * @param {EmailMessage} message Email payload
 * @return {Promise<void>} Resolves when delivery is attempted
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  const provider = getEmailProvider();

  if (provider === "workspace") {
    await sendWithWorkspace(message);
    logger.info("Reminder email sent via workspace", {
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
