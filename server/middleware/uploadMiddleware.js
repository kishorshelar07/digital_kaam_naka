/**
 * middleware/uploadMiddleware.js — Multer File Upload Handler
 * Author: Digital Kaam Naka Dev Team
 */

const multer = require('multer');
const { sendError } = require('../utils/responseHelper');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and PDF files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
});

const handleUpload = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return sendError(res, 'File too large. Max 5MB.', 400);
      if (err.code === 'LIMIT_FILE_COUNT') return sendError(res, 'Too many files. Max 5.', 400);
      return sendError(res, err.message, 400);
    }
    if (err) return sendError(res, err.message, 400);
    next();
  });
};

module.exports = {
  uploadProfilePhoto:     handleUpload(upload.single('profilePhoto')),
  uploadAadhar:           handleUpload(upload.single('aadharPhoto')),
  uploadEvidence:         handleUpload(upload.array('evidence', 5)),
  uploadCompletionPhotos: handleUpload(upload.array('completionPhotos', 5)),
  uploadSitePhotos:       handleUpload(upload.array('sitePhotos', 5)),
};
