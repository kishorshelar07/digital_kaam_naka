/**
 * routes/bookingRoutes.js
 * Author: Digital Kaam Naka Dev Team
 */
const express = require('express');
const router = express.Router();
const bc = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/',             protect, bc.getMyBookings);
router.post('/',            protect, authorize('employer'), bc.createBooking);
router.get('/:id',          protect, bc.getBookingById);
router.put('/:id/accept',   protect, authorize('worker'), bc.acceptBooking);
router.put('/:id/reject',   protect, authorize('worker'), bc.rejectBooking);
router.put('/:id/start',    protect, authorize('worker'), bc.startWork);
router.put('/:id/complete', protect, bc.completeWork);
router.put('/:id/cancel',   protect, bc.cancelBooking);

module.exports = router;
