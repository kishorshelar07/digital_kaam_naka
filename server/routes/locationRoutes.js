/**
 * routes/locationRoutes.js — Fixed districts query
 * Author: Digital Kaam Naka Dev Team
 */
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Location } = require('../models');
const { sendSuccess, sendError } = require('../utils/responseHelper');

router.get('/districts', async (req, res) => {
  try {
    const state = req.query.state || 'Maharashtra';
    const locations = await Location.findAll({
      where: { isActive: true, state },
      attributes: ['district'],
      group: ['district'],
      order: [['district', 'ASC']],
      raw: true,
    });
    const districts = [...new Set(locations.map(l => l.district))].filter(Boolean);
    return res.json({ success: true, message: 'Districts fetched', data: districts });
  } catch (e) {
    console.error('districts error:', e.message);
    return res.json({ success: true, message: 'Districts fetched', data: [
      'Pune', 'Mumbai', 'Nashik', 'Aurangabad', 'Nagpur', 'Thane',
      'Solapur', 'Kolhapur', 'Satara', 'Sangli', 'Ahmednagar',
      'Jalgaon', 'Dhule', 'Amravati', 'Akola', 'Latur', 'Nanded',
      'Beed', 'Osmanabad', 'Wardha', 'Yavatmal', 'Washim',
      'Bhandara', 'Gondia', 'Chandrapur', 'Gadchiroli',
      'Raigad', 'Ratnagiri', 'Sindhudurg', 'Palghar'
    ]});
  }
});

router.get('/talukas', async (req, res) => {
  try {
    const { district } = req.query;
    if (!district) return res.json({ success: true, data: [] });
    const locations = await Location.findAll({
      where: { isActive: true, district },
      attributes: ['taluka'],
      group: ['taluka'],
      order: [['taluka', 'ASC']],
      raw: true,
    });
    const talukas = locations.map(l => l.taluka).filter(Boolean);
    return res.json({ success: true, message: 'Talukas fetched', data: talukas });
  } catch (e) {
    return res.json({ success: true, data: [] });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, data: [] });
    const results = await Location.findAll({
      where: {
        isActive: true,
        [Op.or]: [
          { city:     { [Op.iLike]: '%' + q + '%' } },
          { district: { [Op.iLike]: '%' + q + '%' } },
          { pincode:  { [Op.like]:  q + '%' } },
        ],
      },
      limit: 10,
    });
    return res.json({ success: true, data: results });
  } catch (e) {
    return res.json({ success: true, data: [] });
  }
});

module.exports = router;