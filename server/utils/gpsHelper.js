/**
 * ================================================================
 * utils/gpsHelper.js — GPS & Distance Calculation Utilities
 * Haversine formula for distance. PostGIS SQL builder for DB queries.
 * Used to find workers near employer and jobs near worker.
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const { sequelize } = require('../config/db');

/**
 * @desc    Calculate distance between two GPS coordinates (Haversine formula)
 * @param   {number} lat1 - Latitude of point 1
 * @param   {number} lon1 - Longitude of point 1
 * @param   {number} lat2 - Latitude of point 2
 * @param   {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers (rounded to 1 decimal)
 */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
};

/**
 * @desc    Build Sequelize literal for PostGIS distance ordering
 *          Used in SQL ORDER BY to sort results by GPS distance
 * @param   {number} lat - Reference latitude (employer's location)
 * @param   {number} lng - Reference longitude
 * @returns {Sequelize.literal} Raw SQL for distance calculation
 */
const buildDistanceLiteral = (lat, lng) => {
  return sequelize.literal(`
    (6371 * acos(
      cos(radians(${parseFloat(lat)}))
      * cos(radians(latitude))
      * cos(radians(longitude) - radians(${parseFloat(lng)}))
      + sin(radians(${parseFloat(lat)}))
      * sin(radians(latitude))
    ))
  `);
};

/**
 * @desc    Build WHERE clause to filter records within a radius
 *          Uses bounding box first (fast) then haversine (accurate)
 * @param   {number} lat      - Center latitude
 * @param   {number} lng      - Center longitude
 * @param   {number} radiusKm - Search radius in kilometers
 * @returns {Object} Sequelize WHERE clause object
 */
const buildRadiusWhere = (lat, lng, radiusKm = 20) => {
  const { Op } = require('sequelize');

  // Approximate degree offsets for bounding box (fast pre-filter)
  const latDelta = radiusKm / 111; // 1 degree lat ≈ 111 km
  const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

  return {
    latitude: {
      [Op.between]: [lat - latDelta, lat + latDelta],
    },
    longitude: {
      [Op.between]: [lng - lngDelta, lng + lngDelta],
    },
  };
};

/**
 * @desc    Validate GPS coordinates
 * @param   {*} lat - Latitude value
 * @param   {*} lng - Longitude value
 * @returns {boolean} true if valid coordinates
 */
const isValidCoordinates = (lat, lng) => {
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  return (
    !isNaN(latNum) && !isNaN(lngNum) &&
    latNum >= -90 && latNum <= 90 &&
    lngNum >= -180 && lngNum <= 180
  );
};

/**
 * @desc    Format distance for display (in km or meters)
 * @param   {number} km - Distance in kilometers
 * @returns {string} Formatted string e.g. "1.2 km" or "500 m"
 */
const formatDistance = (km) => {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
};

module.exports = {
  haversineDistance,
  buildDistanceLiteral,
  buildRadiusWhere,
  isValidCoordinates,
  formatDistance,
};
