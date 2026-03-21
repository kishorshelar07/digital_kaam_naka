/**
 * ================================================================
 * config/cloudinary.js — Cloudinary CDN Configuration
 * Handles uploading files from memory buffer to Cloudinary.
 * Organizes files into folders by type (profiles, aadhar, evidence).
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

// Configure Cloudinary with env credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Always use HTTPS
});

/**
 * @desc    Upload a file buffer to Cloudinary
 * @param   {Buffer} buffer    - File buffer from Multer memory storage
 * @param   {string} folder    - Cloudinary folder (e.g. 'profiles', 'aadhar')
 * @param   {string} publicId  - Optional custom public ID
 * @param   {Object} options   - Additional Cloudinary options
 * @returns {Promise<string>}  Cloudinary secure URL
 */
const uploadToCloudinary = (buffer, folder = 'uploads', publicId = null, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: `kamnaka/${folder}`,
      resource_type: 'auto',
      // Auto-optimize quality and format
      quality: 'auto',
      fetch_format: 'auto',
      // Limit dimensions for profile photos
      transformation: folder === 'profiles' ? [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      ] : undefined,
      ...options,
    };

    if (publicId) uploadOptions.public_id = publicId;

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload failed:', error.message);
          reject(new Error('File upload failed. Please try again.'));
        } else {
          resolve(result.secure_url);
        }
      }
    );

    stream.end(buffer);
  });
};

/**
 * @desc    Delete a file from Cloudinary by URL
 * @param   {string} url - Cloudinary secure URL
 * @returns {Promise<boolean>}
 */
const deleteFromCloudinary = async (url) => {
  try {
    if (!url || !url.includes('cloudinary.com')) return false;

    // Extract public_id from URL
    const parts = url.split('/');
    const filename = parts[parts.length - 1].split('.')[0];
    const folder = parts[parts.length - 2];
    const publicId = `kamnaka/${folder}/${filename}`;

    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    logger.error('Cloudinary delete failed:', error.message);
    return false;
  }
};

module.exports = { cloudinary, uploadToCloudinary, deleteFromCloudinary };
