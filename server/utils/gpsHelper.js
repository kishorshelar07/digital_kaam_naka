/**
 * ================================================================
 * utils/gpsHelper.js — GPS / Geospatial Helper (MongoDB Version)
 * REPLACES: PostGIS-based bounding box + ST_DWithin approach
 * NOW USES:  MongoDB 2dsphere index + $near / $geoWithin operators
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

/**
 * @desc    Validate that lat/lng are proper numbers in valid range
 * @param   {any} lat
 * @param   {any} lng
 * @returns {boolean}
 */
const isValidCoordinates = (lat, lng) => {
  const la = parseFloat(lat);
  const lo = parseFloat(lng);
  return !isNaN(la) && !isNaN(lo) && la >= -90 && la <= 90 && lo >= -180 && lo <= 180;
};

/**
 * @desc    Build a MongoDB $near query for a 2dsphere-indexed `location` field.
 *          Use this in Worker.find({ location: buildNearQuery(lat, lng, radiusKm) })
 *
 * @param   {number} lat       - Reference latitude
 * @param   {number} lng       - Reference longitude
 * @param   {number} radiusKm  - Search radius in kilometres
 * @returns {Object}           - MongoDB $near query object
 *
 * REPLACES: buildRadiusWhere() (PostGIS bounding box SQL approach)
 *
 * Example usage in controller:
 *   const workers = await Worker.find({
 *     isAvailable: true,
 *     location: buildNearQuery(lat, lng, 20)
 *   });
 */
const buildNearQuery = (lat, lng, radiusKm = 20) => ({
  $near: {
    $geometry: {
      type: 'Point',
      coordinates: [parseFloat(lng), parseFloat(lat)], // NOTE: MongoDB is [lng, lat]
    },
    $maxDistance: radiusKm * 1000, // MongoDB uses metres
  },
});

/**
 * @desc    Build a MongoDB $geoWithin query.
 *          Slightly faster than $near because it does NOT sort by distance.
 *          Use when you only need "workers inside radius" without distance ordering.
 *
 * @param   {number} lat
 * @param   {number} lng
 * @param   {number} radiusKm
 * @returns {Object}
 */
const buildWithinQuery = (lat, lng, radiusKm = 20) => ({
  $geoWithin: {
    $centerSphere: [
      [parseFloat(lng), parseFloat(lat)],
      radiusKm / 6371, // Convert km to radians (Earth radius = 6371 km)
    ],
  },
});

/**
 * @desc    Build a GeoJSON Point object to store in a document's `location` field.
 *          Call this whenever a worker/employer sets their coordinates.
 *
 * @param   {number} lat
 * @param   {number} lng
 * @returns {Object|null}  GeoJSON Point or null if coordinates invalid
 *
 * Example:
 *   await Worker.findByIdAndUpdate(workerId, {
 *     latitude: lat,
 *     longitude: lng,
 *     location: buildGeoPoint(lat, lng),
 *   });
 */
const buildGeoPoint = (lat, lng) => {
  if (!isValidCoordinates(lat, lng)) return undefined;
  return {
    type: 'Point',
    coordinates: [parseFloat(lng), parseFloat(lat)], // [lng, lat] — MongoDB convention
  };
};

/**
 * @desc    Calculate straight-line distance between two GPS points
 *          using the Haversine formula.
 *          Use this to filter/annotate results after a $geoWithin query.
 *
 * @param   {number} lat1
 * @param   {number} lng1
 * @param   {number} lat2
 * @param   {number} lng2
 * @returns {number}  Distance in kilometres (1 decimal place)
 */
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
};

/**
 * @desc    Annotate an array of worker/document objects with their distance
 *          from a reference point. Useful after $geoWithin queries.
 *
 * @param   {Array}  docs     - Array of Mongoose documents with latitude/longitude fields
 * @param   {number} refLat   - Reference latitude
 * @param   {number} refLng   - Reference longitude
 * @returns {Array}           - Same docs with a `distance` field added (in km)
 */
const annotateWithDistance = (docs, refLat, refLng) => {
  return docs.map((doc) => {
    const obj = doc.toObject ? doc.toObject() : { ...doc };
    if (obj.latitude && obj.longitude) {
      obj.distance = haversineDistance(refLat, refLng, obj.latitude, obj.longitude);
    } else {
      obj.distance = null;
    }
    return obj;
  });
};

module.exports = {
  isValidCoordinates,
  buildNearQuery,
  buildWithinQuery,
  buildGeoPoint,
  haversineDistance,
  annotateWithDistance,
};
