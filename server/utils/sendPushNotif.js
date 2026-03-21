/**
 * ================================================================
 * utils/sendPushNotif.js — Firebase Cloud Messaging (FCM)
 * Sends real-time push notifications to worker/employer devices.
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const logger = require('./logger');

let admin;
try {
  admin = require('firebase-admin');
  if (!admin.apps.length && process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    logger.info('Firebase Admin initialized');
  }
} catch (e) {
  logger.warn('Firebase not configured — push notifications disabled');
}

/**
 * @desc    Send push notification to a single device
 * @param   {string} fcmToken - Device FCM token
 * @param   {string} title    - Notification title
 * @param   {string} body     - Notification body
 * @param   {Object} data     - Additional data payload (for deep linking)
 * @returns {Promise<boolean>}
 */
const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!admin || !admin.apps.length || !fcmToken) {
    logger.warn(`[PUSH SKIPPED] Title: ${title}`);
    return false;
  }

  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data: {
        ...Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      android: {
        priority: 'high',
        notification: { sound: 'default', channelId: 'kamnaka_alerts' },
      },
      apns: {
        payload: { aps: { sound: 'default', badge: 1 } },
      },
    });

    logger.info(`Push sent: "${title}"`);
    return true;
  } catch (error) {
    logger.error(`Push notification failed: ${error.message}`);
    return false;
  }
};

/**
 * @desc    Send push to multiple devices (multicast)
 * @param   {string[]} tokens - Array of FCM tokens
 * @param   {string}   title  - Notification title
 * @param   {string}   body   - Notification body
 * @param   {Object}   data   - Additional data
 * @returns {Promise<{successCount, failureCount}>}
 */
const sendMulticastPush = async (tokens, title, body, data = {}) => {
  if (!admin || !admin.apps.length || !tokens.length) {
    logger.warn(`[MULTICAST PUSH SKIPPED] Title: ${title} | Tokens: ${tokens.length}`);
    return { successCount: 0, failureCount: tokens.length };
  }

  try {
    const message = {
      tokens,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: { priority: 'high' },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    logger.info(`Multicast push: ${response.successCount} sent, ${response.failureCount} failed`);
    return { successCount: response.successCount, failureCount: response.failureCount };
  } catch (error) {
    logger.error(`Multicast push failed: ${error.message}`);
    return { successCount: 0, failureCount: tokens.length };
  }
};

module.exports = { sendPushNotification, sendMulticastPush };
