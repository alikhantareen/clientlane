import nodemailer from 'nodemailer';

// For local development, use a local SMTP server like MailHog or MailCatcher
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: Number(process.env.SMTP_PORT) || 1025,
  auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
});

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  return await transporter.sendMail({
    from: process.env.SMTP_FROM || 'Clientlane <noreply@clientlane.local>',
    to,
    subject,
    html,
  });
} 