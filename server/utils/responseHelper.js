/**
 * ================================================================
 * utils/responseHelper.js — Standard API Response Formatter
 * Every API endpoint uses these helpers for consistent responses.
 * Format: { success, message, data, count, error }
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

/**
 * @desc    Send a success response
 * @param   {Object} res       - Express response object
 * @param   {string} message   - Human-readable success message
 * @param   {*}      data      - Response payload
 * @param   {number} statusCode - HTTP status code (default 200)
 * @param   {number} count     - Total records (for paginated lists)
 */
const sendSuccess = (res, message, data = null, statusCode = 200, count = null) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  if (count !== null) response.count = count;
  return res.status(statusCode).json(response);
};

/**
 * @desc    Send an error response
 * @param   {Object} res        - Express response object
 * @param   {string} message    - Human-readable error message
 * @param   {number} statusCode - HTTP status code (default 400)
 * @param   {string} error      - Technical error detail (dev only)
 */
const sendError = (res, message, statusCode = 400, error = null) => {
  const response = { success: false, message };
  if (error && process.env.NODE_ENV === 'development') response.error = error;
  return res.status(statusCode).json(response);
};

/**
 * @desc    Send paginated list response
 * @param   {Object} res      - Express response object
 * @param   {string} message  - Success message
 * @param   {Array}  rows     - Array of records
 * @param   {number} count    - Total matching records (for pagination UI)
 * @param   {number} page     - Current page number
 * @param   {number} limit    - Records per page
 */
const sendPaginated = (res, message, rows, count, page, limit) => {
  return res.status(200).json({
    success: true,
    message,
    data: rows,
    count,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
      hasNext: page * limit < count,
      hasPrev: page > 1,
    },
  });
};

module.exports = { sendSuccess, sendError, sendPaginated };
