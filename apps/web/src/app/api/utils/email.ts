import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendWorkflowEmail({ to, subject, html }: EmailPayload) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log('⚠️ Gmail SMTP credentials missing in configuration.');
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"EduFlow Support" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
    });

    console.log('✨ Live email blasted to external target inbox via Gmail SMTP:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Gmail SMTP transmission failed:', error);
    throw error;
  }
}