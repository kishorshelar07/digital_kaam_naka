/**
 * routes/jobRoutes.js
 * Author: Digital Kaam Naka Dev Team
 */
const express = require('express');
const router = express.Router();
const jc = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/',       jc.getAllJobs);
router.get('/nearby', protect, authorize('worker'), jc.getNearbyJobs);
router.post('/',      protect, authorize('employer', 'admin'), jc.createJob);
router.get('/:id',    jc.getJobById);
router.put('/:id',    protect, authorize('employer', 'admin'), jc.updateJob);
router.delete('/:id', protect, authorize('employer', 'admin'), jc.cancelJob);

module.exports = router;
