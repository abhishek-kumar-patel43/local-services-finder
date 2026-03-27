const express = require('express');
const db = require('../config/db');
const { protect, providerOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// ─────────────────────────────────────────
// REGISTER AS A PROVIDER
// POST /api/providers/register
// Only logged-in users with role "provider" can do this
// ─────────────────────────────────────────
router.post('/register', protect, providerOnly, async (req, res) => {
  try {
    const { service_type, area, pin_code, price_range, bio, contact } = req.body;

    // Basic validation
    if (!service_type || !area || !pin_code) {
      return res.status(400).json({
        message: 'service_type, area and pin_code are required'
      });
    }

    // Check if this provider already registered a service
    const existing = await db.query(
      'SELECT id FROM providers WHERE user_id = $1',
      [req.user.id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({
        message: 'You have already registered a service. Use update instead.'
      });
    }

    // Save to providers table
    // req.user.id comes from the JWT token (set by our protect middleware)
    const result = await db.query(
      `INSERT INTO providers
        (user_id, service_type, area, pin_code, price_range, bio, contact)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, service_type, area, pin_code, price_range, bio, contact]
    );

    res.status(201).json({
      message: 'Service registered successfully',
      provider: result.rows[0],
    });

  } catch (error) {
    console.error('Register provider error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});


// ─────────────────────────────────────────
// GET A SINGLE PROVIDER'S PROFILE
// GET /api/providers/:id
// Anyone can view a profile (no login needed)
// ─────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Join providers table with users table to also get the provider's name
    const result = await db.query(
      `SELECT
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
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    res.json({ provider: result.rows[0] });

  } catch (error) {
    console.error('Get provider error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});


// ─────────────────────────────────────────
// GET LOGGED-IN PROVIDER'S OWN PROFILE
// GET /api/providers/my/profile
// ─────────────────────────────────────────
router.get('/my/profile', protect, providerOnly, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, u.name, u.email
       FROM providers p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'No service registered yet'
      });
    }

    res.json({ provider: result.rows[0] });

  } catch (error) {
    console.error('My profile error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;