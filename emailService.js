/**
 * Email Utility
 * Nodemailer-based email sending for OTP, notifications, etc.
 */

const nodemailer = require('nodemailer');

// ─── Create Transporter ───────────────────────────────────────────────────────
const createTransporter = async () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
};

// ─── Send Email ───────────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html, text }) => {
  let transporter;
  try {
    transporter = await createTransporter();
    // Verify transporter connection
    await transporter.verify();
  } catch (error) {
    console.error('❌ Gmail Auth Error:', error);
    console.warn('⚠️ Falling back to Ethereal Test Account...');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass }
    });
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'JobPortal <noreply@jobportal.com>',
      to,
      subject,
      text,
      html
    });
    
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`🔗 VIEW YOUR EMAIL HERE: ${previewUrl}\n`);
    }
    
    return { success: true, info, previewUrl };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    return { success: false, error: error.message };
  }
};

// ─── Email Templates ──────────────────────────────────────────────────────────
exports.sendOTPEmail = async (user, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #6366f1; font-size: 28px; margin: 0;">JobPortal</h1>
        <p style="color: #94a3b8; margin-top: 5px;">Your Career, Our Platform</p>
      </div>
      <h2 style="color: #f1f5f9;">Verify Your Email</h2>
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>Your One-Time Password (OTP) for email verification is:</p>
      <div style="background: #1e293b; border: 2px solid #6366f1; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #6366f1;">${otp}</span>
      </div>
      <p style="color: #94a3b8; font-size: 14px;">This OTP expires in <strong>${process.env.OTP_EXPIRE || 10} minutes</strong>.</p>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 30px; border-top: 1px solid #334155; padding-top: 20px;">
        If you didn't request this, please ignore this email.
      </p>
    </div>
  `;
  return sendEmail({ to: user.email, subject: 'JobPortal - Email Verification OTP', html });
};

exports.sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 12px;">
      <h1 style="color: #6366f1;">JobPortal</h1>
      <h2>Password Reset Request</h2>
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>Click the button below to reset your password:</p>
      <a href="${resetUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin: 20px 0; font-weight: bold;">
        Reset Password
      </a>
      <p style="color: #94a3b8; font-size: 14px;">This link expires in 1 hour.</p>
      <p style="color: #64748b; font-size: 12px; word-break: break-all;">Or copy: ${resetUrl}</p>
    </div>
  `;
  return sendEmail({ to: user.email, subject: 'JobPortal - Password Reset', html });
};

exports.sendApplicationConfirmationEmail = async (user, job) => {
  const location = job.location ? `${job.location.city}, ${job.location.state || job.location.country}` : 'Remote';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #6366f1; font-size: 28px; margin: 0;">JobPortal</h1>
      </div>
      <h2 style="color: #f1f5f9;">Application Received!</h2>
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>Your application for <strong>${job.title}</strong> at <strong>${job.company?.name || 'Company'}</strong> has been successfully submitted.</p>
      <div style="background: #1e293b; border-left: 4px solid #10b981; padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0;">
        <p style="margin: 0; color: #10b981; font-weight: bold;">Status: Applied</p>
      </div>
      <div style="background: #0f172a; border: 1px solid #334155; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 14px;">
        <p style="margin: 5px 0; color: #cbd5e1;"><strong>Candidate Name:</strong> ${user.name}</p>
        <p style="margin: 5px 0; color: #cbd5e1;"><strong>Job ID:</strong> ${job._id}</p>
        <p style="margin: 5px 0; color: #cbd5e1;"><strong>Location:</strong> ${location}</p>
      </div>
      <p>You can track the progress of your application in your dashboard.</p>
      <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0; font-weight: bold;">
        Go to Dashboard
      </a>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 30px; border-top: 1px solid #334155; padding-top: 20px;">
        Thank you for using JobPortal!
      </p>
    </div>
  `;
  return sendEmail({ to: user.email, subject: `Application Successful: ${job.title}`, html });
};

exports.sendApplicationEmail = async (recruiterEmail, applicantName, jobTitle) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 12px;">
      <h1 style="color: #6366f1;">JobPortal</h1>
      <h2>New Application Received</h2>
      <p><strong>${applicantName}</strong> has applied for <strong>${jobTitle}</strong>.</p>
      <p>Log in to your recruiter dashboard to review their profile and resume.</p>
    </div>
  `;
  return sendEmail({ to: recruiterEmail, subject: `New Application: ${jobTitle}`, html });
};

exports.sendStatusUpdateEmail = async (applicantEmail, applicantName, jobTitle, status) => {
  const statusMessages = {
    shortlisted: { color: '#22c55e', msg: 'Congratulations! You have been shortlisted.' },
    interview: { color: '#3b82f6', msg: 'You have been invited for an interview.' },
    rejected: { color: '#ef4444', msg: 'Unfortunately, your application was not selected.' },
    hired: { color: '#f59e0b', msg: '🎉 Congratulations! You have been hired!' }
  };
  const info = statusMessages[status] || { color: '#6366f1', msg: 'Your application status has been updated.' };
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 12px;">
      <h1 style="color: #6366f1;">JobPortal</h1>
      <h2>Application Update: ${jobTitle}</h2>
      <p>Hello <strong>${applicantName}</strong>,</p>
      <div style="background: #1e293b; border-left: 4px solid ${info.color}; padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0;">
        <p style="margin: 0; color: ${info.color}; font-weight: bold;">${info.msg}</p>
      </div>
      <p>Log in to your dashboard to see more details.</p>
    </div>
  `;
  return sendEmail({ to: applicantEmail, subject: `Application Update: ${jobTitle}`, html });
};
