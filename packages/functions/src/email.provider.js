"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const logger = __importStar(require("firebase-functions/logger"));
/**
 * Resolve outbound email provider from environment.
 * @return {EmailProvider} Active provider name
 */
function getEmailProvider() {
    const raw = (process.env.EMAIL_PROVIDER || "log").trim().toLowerCase();
    return raw === "sendgrid" ? "sendgrid" : "log";
}
/**
 * Send an email using SendGrid v3 Mail Send API.
 * @param {EmailMessage} message Email payload
 * @return {Promise<void>} Resolves on successful submission
 */
async function sendWithSendGrid(message) {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    if (!apiKey || !fromEmail) {
        throw new Error("Missing SENDGRID_API_KEY or SENDGRID_FROM_EMAIL for sendgrid provider");
    }
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            personalizations: [{ to: [{ email: message.to }] }],
            from: { email: fromEmail },
            subject: message.subject,
            content: [
                { type: "text/plain", value: message.text },
                { type: "text/html", value: message.html },
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
async function sendEmail(message) {
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
//# sourceMappingURL=email.provider.js.map