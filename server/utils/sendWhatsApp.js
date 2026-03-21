/**
 * ================================================================
 * utils/sendWhatsApp.js — WhatsApp Business API Notifications
 * Sends booking confirmations and important updates via WhatsApp.
 * Most workers in Maharashtra use WhatsApp daily — high open rate.
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const axios = require('axios');
const logger = require('./logger');

const WA_BASE_URL = `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v18.0'}`;

/**
 * @desc    Send a WhatsApp text message via Meta Business API
 * @param   {string} to      - Recipient phone (Indian format, 10 digits)
 * @param   {string} message - Message text
 * @returns {Promise<boolean>}
 */
const sendWhatsApp = async (to, message) => {
  if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
    logger.warn(`[WHATSAPP SKIPPED] To: ${to} | Message: ${message.substring(0, 50)}...`);
    return false;
  }

  try {
    const formattedTo = to.startsWith('91') ? to : `91${to}`;

    await axios.post(
      `${WA_BASE_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: formattedTo,
        type: 'text',
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    logger.info(`WhatsApp sent to ${formattedTo}`);
    return true;
  } catch (error) {
    logger.error(`WhatsApp send failed: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
};

/**
 * @desc    Send booking confirmation to worker via WhatsApp
 * @param   {string} workerPhone   - Worker's phone number
 * @param   {string} workerName    - Worker's name
 * @param   {string} employerName  - Employer's name
 * @param   {string} jobTitle      - Job title
 * @param   {string} date          - Work date
 * @param   {number} rate          - Agreed daily rate
 * @param   {string} lang          - Language preference
 */
const sendBookingConfirmationToWorker = async (workerPhone, workerName, employerName, jobTitle, date, rate, lang = 'mr') => {
  const messages = {
    mr: `✅ नमस्कार ${workerName}!\n\n*नवीन काम मिळालं!*\n\n👤 मालक: ${employerName}\n💼 काम: ${jobTitle}\n📅 तारीख: ${date}\n💰 रोज: ₹${rate}\n\nDigital Kaam Naka वर login करून confirm करा.\nwww.digitalkamnaka.in`,
    hi: `✅ नमस्ते ${workerName}!\n\n*नया काम मिला!*\n\n👤 मालिक: ${employerName}\n💼 काम: ${jobTitle}\n📅 तारीख: ${date}\n💰 दैनिक: ₹${rate}\n\nDigital Kaam Naka पर login करके confirm करें.\nwww.digitalkamnaka.in`,
    en: `✅ Hello ${workerName}!\n\n*New job request received!*\n\n👤 Employer: ${employerName}\n💼 Work: ${jobTitle}\n📅 Date: ${date}\n💰 Daily: ₹${rate}\n\nLogin to Digital Kaam Naka to confirm.\nwww.digitalkamnaka.in`,
  };

  return await sendWhatsApp(workerPhone, messages[lang] || messages.en);
};

/**
 * @desc    Send booking acceptance notification to employer
 */
const sendAcceptanceToEmployer = async (employerPhone, employerName, workerName, jobTitle, date, lang = 'mr') => {
  const messages = {
    mr: `🎉 ${employerName} साहेब,\n\n*${workerName}* यांनी तुमची booking *accept* केली!\n\n💼 काम: ${jobTitle}\n📅 तारीख: ${date}\n\nDigital Kaam Naka वर details पाहा.\nwww.digitalkamnaka.in`,
    hi: `🎉 ${employerName} जी,\n\n*${workerName}* ने आपकी booking *accept* की!\n\n💼 काम: ${jobTitle}\n📅 तारीख: ${date}\n\nDigital Kaam Naka पर details देखें.\nwww.digitalkamnaka.in`,
    en: `🎉 Dear ${employerName},\n\n*${workerName}* has *accepted* your booking!\n\n💼 Work: ${jobTitle}\n📅 Date: ${date}\n\nView details on Digital Kaam Naka.\nwww.digitalkamnaka.in`,
  };

  return await sendWhatsApp(employerPhone, messages[lang] || messages.en);
};

module.exports = { sendWhatsApp, sendBookingConfirmationToWorker, sendAcceptanceToEmployer };
