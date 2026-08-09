import { BrevoClient } from "@getbrevo/brevo";

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

export const sendEmail = async ({ email, subject, message }) => {
  await brevo.transactionalEmails.sendTransacEmail({
    sender: { name: "ShopSmart AI", email: process.env.BREVO_FROM_EMAIL },
    to: [{ email }],
    subject,
    htmlContent: message,
  });
};