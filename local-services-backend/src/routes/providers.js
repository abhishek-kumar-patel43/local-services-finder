const express = require('express');
const db = require('../config/db');
const { protect, providerOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// ─────────────────────────────────────────
// REGISTER AS A PROVIDER
// POST /api/providers/register
// Only authenticated users with role "provider"
// ─────────────────────────────────────────
router.post('/register', protect, providerOnly, async (req, res) => {
  try {

    // Extract request body
    const { service_type, area, pin_code, price_range, bio, contact } = req.body;

    // Validate required fields
    if (!service_type || !area || !pin_code) {
      return res.status(400).json({
        message: 'service_type, area and pin_code are required'
      });
    }

    const userId = req.user.id;

    // ─────────────────────────────────────────
    // CHECK IF PROVIDER ALREADY EXISTS
    // ─────────────────────────────────────────
    const existingProvider = await db.query(
      'SELECT id FROM providers WHERE user_id = $1',
      [userId]
    );

    if (existingProvider.rows.length > 0) {
      return res.status(400).json({
        message: 'You have already registered a service. Use update instead.'
      });
    }

    // ─────────────────────────────────────────
    // INSERT NEW PROVIDER RECORD
    // ─────────────────────────────────────────
    const insertQuery = `
      INSERT INTO providers
        (user_id, service_type, area, pin_code, price_range, bio, contact)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const queryValues = [
      userId,
      service_type,
      area,
      pin_code,
      price_range,
      bio,
      contact
    ];

    const queryResult = await db.query(insertQuery, queryValues);

    // Send success response
    res.status(201).json({
      message: 'Service registered successfully',
      provider: queryResult.rows[0],
    });

  } catch (error) {
    console.error('Register provider error:', error);

    res.status(500).json({
      message: 'Server error'
    });
  }
});


// ─────────────────────────────────────────
// GET A SINGLE PROVIDER PROFILE
// GET /api/providers/:id
// Public route (no authentication required)
// ─────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {

    const { id } = req.params;

    // Query to fetch provider with user details
    const getProviderQuery = `
      SELECT
        p.id,
        p.service_type,
        p.area,
        p.pin_code,
        p.price_range,
        p.bio,
        p.contact,
        p.avg_rating,
        p.created_at,
        u.name  AS provider_name,
        u.email AS provider_email
      FROM providers p
      JOIN users u ON u.id = p.user_id
      WHERE p.id = $1
    `;

    const queryResult = await db.query(getProviderQuery, [id]);

    if (queryResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Provider not found'
      });
    }

    res.json({
      provider: queryResult.rows[0]
    });

  } catch (error) {
    console.error('Get provider error:', error);

    res.status(500).json({
      message: 'Server error'
    });
  }
});


// ─────────────────────────────────────────
// GET LOGGED-IN PROVIDER PROFILE
// GET /api/providers/my/profile
// Protected route
// ─────────────────────────────────────────
router.get('/my/profile', protect, providerOnly, async (req, res) => {
  try {

    const userId = req.user.id;

    // Query to fetch logged-in provider profile
    const myProfileQuery = `
      SELECT p.*, u.name, u.email
      FROM providers p
      JOIN users u ON u.id = p.user_id
      WHERE p.user_id = $1
    `;

    const queryResult = await db.query(myProfileQuery, [userId]);

    if (queryResult.rows.length === 0) {
      return res.status(404).json({
        message: 'No service registered yet'
      });
    }

    res.json({
      provider: queryResult.rows[0]
    });

  } catch (error) {
    console.error('My profile error:', error);

    res.status(500).json({
      message: 'Server error'
    });
  }
});

module.exports = router;