/**
 * routes/workerRoutes.js
 * Author: Digital Kaam Naka Dev Team
 */
const express = require('express');
const router = express.Router();
const wc = require('../controllers/workerController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/',              wc.getAllWorkers);
router.get('/nearby',        wc.getNearbyWorkers);
router.post('/availability', protect, authorize('worker'), wc.setAvailability);
router.get('/:id',           wc.getWorkerById);
router.put('/:id',           protect, authorize('worker', 'admin'), wc.updateWorker);
router.get('/:id/reviews',   wc.getWorkerReviews);
router.get('/:id/bookings',  protect, wc.getWorkerBookings);
router.get('/:id/earnings',  protect, wc.getWorkerEarnings);

module.exports = router;
