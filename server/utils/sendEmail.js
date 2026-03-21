/**
 * ================================================================
 * utils/sendEmail.js — Email Notifications via Nodemailer
 * Used for: booking summaries, receipts, admin alerts.
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create reusable transporter (lazy initialized)
let transporter;
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

/**
 * @desc    Send an email
 * @param   {string} to      - Recipient email
 * @param   {string} subject - Email subject
 * @param   {string} html    - HTML email body
 * @param   {string} text    - Plain text fallback
 * @returns {Promise<boolean>}
 */
const sendEmail = async (to, subject, html, text = '') => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    logger.warn(`[EMAIL SKIPPED] To: ${to} | Subject: ${subject}`);
    return false;
  }

  try {
    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || `Digital Kaam Naka <noreply@digitalkamnaka.in>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });

    logger.info(`Email sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    logger.error(`Email failed to ${to}: ${error.message}`);
    return false;
  }
};

/**
 * @desc    Send booking confirmation email with receipt
 */
const sendBookingEmail = async (to, bookingDetails) => {
  const { workerName, employerName, jobTitle, date, rate, totalAmount, bookingId } = bookingDetails;

  const html = `
    <div style="font-family: 'Noto Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #F97316; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">Digital Kaam Naka</h1>
        <p style="color: #fff3e0; margin: 5px 0 0;">Booking Confirmation</p>
      </div>
      <div style="background: #fff; border: 1px solid #e5e7eb; padding: 30px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #1E3A5F;">Booking #${bookingId} Confirmed ✅</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; color: #6B7280;">Worker</td><td style="padding: 8px; font-weight: bold;">${workerName}</td></tr>
          <tr style="background: #f9fafb;"><td style="padding: 8px; color: #6B7280;">Employer</td><td style="padding: 8px; font-weight: bold;">${employerName}</td></tr>
          <tr><td style="padding: 8px; color: #6B7280;">Work</td><td style="padding: 8px;">${jobTitle}</td></tr>
          <tr style="background: #f9fafb;"><td style="padding: 8px; color: #6B7280;">Date</td><td style="padding: 8px;">${date}</td></tr>
          <tr><td style="padding: 8px; color: #6B7280;">Daily Rate</td><td style="padding: 8px;">₹${rate}</td></tr>
          <tr style="background: #f97316; color: white;"><td style="padding: 10px; font-weight: bold;">Total Amount</td><td style="padding: 10px; font-weight: bold; font-size: 1.2em;">₹${totalAmount}</td></tr>
        </table>
        <div style="margin-top: 20px; text-align: center;">
          <a href="https://digitalkamnaka.in/bookings/${bookingId}" style="background: #F97316; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">View Booking Details</a>
        </div>
        <p style="color: #6B7280; font-size: 12px; margin-top: 20px; text-align: center;">
          Digital Kaam Naka — Ghari Basa, Kaam Mila!<br>
          digitalkamnaka.in
        </p>
      </div>
    </div>
  `;

  return await sendEmail(to, `Booking Confirmed — ${jobTitle} | Digital Kaam Naka`, html);
};

module.exports = { sendEmail, sendBookingEmail };
