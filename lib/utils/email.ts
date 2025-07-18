import nodemailer from 'nodemailer';

// Gmail SMTP configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || process.env.GMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  console.log('📧 Sending email to:', to);
  console.log('📧 Using Gmail SMTP...');
  
  try {
    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Clientlane <noreply@clientlane.com>',
      to,
      subject,
      html,
    });
    console.log('✅ Gmail SMTP email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Gmail SMTP email error:', error);
    throw error;
  }
} 