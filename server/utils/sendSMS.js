/**
 * ================================================================
 * utils/sendSMS.js — SMS via Twilio (OTP + notifications)
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const twilio = require('twilio');
const logger = require('./logger');

let client;
try {
  client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
} catch (e) {
  logger.warn('Twilio not configured — SMS sending disabled');
}

/**
 * @desc    Send an SMS message via Twilio
 * @param   {string} to      - Recipient phone number (E.164 format, e.g. +919876543210)
 * @param   {string} message - SMS body text
 * @returns {Promise<boolean>} true if sent, false if failed
 */
const sendSMS = async (to, message) => {
  if (!client) {
    logger.warn(`[SMS SKIPPED] To: ${to} | Message: ${message}`);
    return false;
  }

  try {
    // Ensure number is in E.164 format for India
    const formattedTo = to.startsWith('+') ? to : `+91${to}`;

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedTo,
    });

    logger.info(`SMS sent to ${formattedTo}`);
    return true;
  } catch (error) {
    logger.error(`SMS send failed to ${to}: ${error.message}`);
    return false;
  }
};

/**
 * @desc    Send OTP via SMS in user's preferred language
 * @param   {string} phone - Phone number
 * @param   {string} otp   - 6-digit OTP
 * @param   {string} lang  - Language code ('mr', 'hi', 'en')
 * @returns {Promise<boolean>}
 */
const sendOtpSMS = async (phone, otp, lang = 'mr') => {
  const messages = {
    mr: `Digital Kaam Naka: Tumcha OTP ${otp} ahe. Ha 10 minutat expire hoil. Kunasahi share karu naka.`,
    hi: `Digital Kaam Naka: Aapka OTP ${otp} hai. Yeh 10 minute mein expire ho jayega. Kisi ke saath share na karein.`,
    en: `Digital Kaam Naka: Your OTP is ${otp}. It expires in 10 minutes. Do not share with anyone.`,
  };

  const message = messages[lang] || messages.en;
  return await sendSMS(phone, message);
};

module.exports = { sendSMS, sendOtpSMS };
