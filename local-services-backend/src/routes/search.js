const express = require('express');
const db = require('../config/db');

const router = express.Router();

// ─────────────────────────────────────────
// SEARCH PROVIDERS
// GET /api/search?service=electrician&pin_code=201301
// Optional: &min_price=100&max_price=500&sort=rating
// No login needed — anyone can search
// ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    // Pull all possible query parameters from the URL
    const { service, pin_code, min_price, max_price, sort } = req.query;

    // service and pin_code are required for search
    if (!service || !pin_code) {
      return res.status(400).json({
        message: 'service and pin_code are required query parameters'
      });
    }

    // We build the SQL query dynamically based on what filters are provided
    // $1 and $2 are placeholders — we fill them safely to prevent SQL injection
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

    // We keep a list of values to pass in safely
    // $1 = service (with % for partial match), $2 = pin_code
    const values = [`%${service}%`, pin_code];

    // Dynamically add price filters if provided
    // Each new condition gets the next $ number
    if (min_price) {
      values.push(min_price);
      query += ` AND CAST(SPLIT_PART(p.price_range, '-', 1) AS INTEGER) >= $${values.length}`;
    }

    if (max_price) {
      values.push(max_price);
      query += ` AND CAST(SPLIT_PART(p.price_range, '-', 2) AS INTEGER) <= $${values.length}`;
    }

    // Sort results — default is by highest rating
    if (sort === 'rating') {
      query += ` ORDER BY p.avg_rating DESC`;
    } else {
      query += ` ORDER BY p.avg_rating DESC`; // default sort
    }

    const result = await db.query(query, values);

    res.json({
      count: result.rows.length,
      providers: result.rows,
    });

  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;