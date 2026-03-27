const express = require('express');
const db = require('../config/db');

const router = express.Router();

// ─────────────────────────────────────────
// SEARCH PROVIDERS API
// GET /api/search?service=electrician&pin_code=201301
// Optional filters:
//   - min_price
//   - max_price
//   - sort (default: rating)
// No authentication required
// ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {

    // Extract query parameters
    const { service, pin_code, min_price, max_price, sort } = req.query;

    // Validate required parameters
    if (!service || !pin_code) {
      return res.status(400).json({
        message: 'service and pin_code are required query parameters'
      });
    }

    // Prepare search pattern for partial matching
    const servicePattern = `%${service}%`;

    // ─────────────────────────────────────────
    // BASE QUERY
    // Fetch providers matching service + pin_code
    // ─────────────────────────────────────────
    let query = `
      SELECT
        p.id,
        p.service_type,
        p.area,
        p.pin_code,
        p.price_range,
        p.bio,
        p.contact,
        p.avg_rating,
        u.name AS provider_name
      FROM providers p
      JOIN users u ON u.id = p.user_id
      WHERE LOWER(p.service_type) LIKE LOWER($1)
        AND p.pin_code = $2
    `;

    // Values for parameterized query
    const queryValues = [servicePattern, pin_code];

    // ─────────────────────────────────────────
    // OPTIONAL PRICE FILTERS
    // Dynamically append conditions if provided
    // ─────────────────────────────────────────
    if (min_price) {
      queryValues.push(min_price);

      query += `
        AND CAST(
          SPLIT_PART(p.price_range, '-', 1) AS INTEGER
        ) >= $${queryValues.length}
      `;
    }

    if (max_price) {
      queryValues.push(max_price);

      query += `
        AND CAST(
          SPLIT_PART(p.price_range, '-', 2) AS INTEGER
        ) <= $${queryValues.length}
      `;
    }

    // ─────────────────────────────────────────
    // SORTING (default: highest rating)
    // ─────────────────────────────────────────
    const sortQuery = ` ORDER BY p.avg_rating DESC`;
    query += sortQuery;

    // Execute query
    const result = await db.query(query, queryValues);

    // Send response
    res.json({
      count: result.rows.length,
      providers: result.rows,
    });

  } catch (error) {
    console.error('Search error:', error);

    res.status(500).json({
      message: 'Server error'
    });
  }
});

module.exports = router;