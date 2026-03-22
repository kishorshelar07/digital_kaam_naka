/**
 * routes/locationRoutes.js
 * Converted from Sequelize PostgreSQL → Mongoose MongoDB
 * Author: Digital Kaam Naka Dev Team
 */
const express = require('express');
const router = express.Router();
// CHANGED: removed Op, sequelize imports
const { Location } = require('../models');
const { sendSuccess } = require('../utils/responseHelper');

// Fallback districts list (used if DB is empty)
const MAHARASHTRA_DISTRICTS = [
  'Pune', 'Mumbai', 'Nashik', 'Aurangabad', 'Nagpur', 'Thane',
  'Solapur', 'Kolhapur', 'Satara', 'Sangli', 'Ahmednagar',
  'Jalgaon', 'Dhule', 'Amravati', 'Akola', 'Latur', 'Nanded',
  'Beed', 'Osmanabad', 'Wardha', 'Yavatmal', 'Washim',
  'Bhandara', 'Gondia', 'Chandrapur', 'Gadchiroli',
  'Raigad', 'Ratnagiri', 'Sindhudurg', 'Palghar',
];

// GET /api/locations/districts
router.get('/districts', async (req, res) => {
  try {
    const state = req.query.state || 'Maharashtra';

    // CHANGED: Location.findAll({ where, group, attributes }) →
    //          Location.distinct('district', filter)
    const districts = await Location.distinct('district', {
      isActive: true,
      state,
    });

    const sorted = districts.filter(Boolean).sort();

    // Fallback to hardcoded list if DB is empty
    return res.json({
      success: true,
      message: 'Districts fetched',
      data: sorted.length > 0 ? sorted : MAHARASHTRA_DISTRICTS,
    });
  } catch (e) {
    console.error('districts error:', e.message);
    return res.json({
      success: true,
      message: 'Districts fetched',
      data: MAHARASHTRA_DISTRICTS,
    });
  }
});

// GET /api/locations/talukas?district=Pune
router.get('/talukas', async (req, res) => {
  try {
    const { district } = req.query;
    if (!district) return res.json({ success: true, data: [] });

    // CHANGED: Location.findAll({ where, group, attributes }) →
    //          Location.distinct('taluka', filter)
    const talukas = await Location.distinct('taluka', {
      isActive: true,
      district,
    });

    return res.json({
      success: true,
      message: 'Talukas fetched',
      data: talukas.filter(Boolean).sort(),
    });
  } catch (e) {
    return res.json({ success: true, data: [] });
  }
});

// GET /api/locations/search?q=pune
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, data: [] });

    // CHANGED: Op.iLike + Op.or → $regex with $or
    const results = await Location.find({
      isActive: true,
      $or: [
        { city:     { $regex: q, $options: 'i' } }, // CHANGED: Op.iLike → $regex 'i'
        { district: { $regex: q, $options: 'i' } },
        { pincode:  { $regex: '^' + q } },          // CHANGED: Op.like 'q%' → $regex '^q'
      ],
    }).limit(10).lean();

    return res.json({ success: true, data: results });
  } catch (e) {
    return res.json({ success: true, data: [] });
  }
});

module.exports = router;
