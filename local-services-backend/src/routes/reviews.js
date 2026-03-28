const express = require('express');
const db = require('../config/db');
const { protect, customerOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// ─────────────────────────────────────────
// LEAVE A REVIEW
// POST /api/reviews/:providerId
// Only logged-in customers can leave reviews
// ─────────────────────────────────────────
router.post('/:providerId', protect, customerOnly, async (req, res) => {
  try {
    const { providerId } = req.params;
    const { rating, comment } = req.body;
    const customerId = req.user.id; // from JWT token

    // Step 1: Validate rating
    if (!rating) {
      return res.status(400).json({ message: 'Rating is required' });
    }

    const ratingNum = parseInt(rating);
    if (ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Step 2: Check the provider actually exists
    const providerCheck = await db.query(
      'SELECT id FROM providers WHERE id = $1',
      [providerId]
    );
    if (providerCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Step 3: Check this customer hasn't already reviewed this provider
    const alreadyReviewed = await db.query(
      'SELECT id FROM reviews WHERE provider_id = $1 AND customer_id = $2',
      [providerId, customerId]
    );
    if (alreadyReviewed.rows.length > 0) {
      return res.status(400).json({
        message: 'You have already reviewed this provider'
      });
    }

    // Step 4: Check the customer is not reviewing themselves
    // (a provider user_id should not match the customer trying to review)
    const selfCheck = await db.query(
      'SELECT id FROM providers WHERE id = $1 AND user_id = $2',
      [providerId, customerId]
    );
    if (selfCheck.rows.length > 0) {
      return res.status(400).json({
        message: 'You cannot review yourself'
      });
    }

    // Step 5: Save the review
    const result = await db.query(
      `INSERT INTO reviews (provider_id, customer_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [providerId, customerId, ratingNum, comment]
    );

    // Step 6: Recalculate and update the provider's average rating
    // AVG() calculates the mean of all ratings for this provider
    const avgResult = await db.query(
      'SELECT ROUND(AVG(rating)::numeric, 2) AS avg_rating FROM reviews WHERE provider_id = $1',
      [providerId]
    );

    const newAvg = avgResult.rows[0].avg_rating;

    await db.query(
      'UPDATE providers SET avg_rating = $1 WHERE id = $2',
      [newAvg, providerId]
    );

    res.status(201).json({
      message: 'Review submitted successfully',
      review: result.rows[0],
      new_avg_rating: newAvg,
    });

  } catch (error) {
    console.error('Submit review error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});


// ─────────────────────────────────────────
// GET ALL REVIEWS FOR A PROVIDER
// GET /api/reviews/:providerId
// No login needed — anyone can read reviews
// ─────────────────────────────────────────
router.get('/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;

    // Check provider exists
    const providerCheck = await db.query(
      'SELECT id, avg_rating FROM providers WHERE id = $1',
      [providerId]
    );
    if (providerCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Get all reviews, newest first
    // We also join with users to show the customer's name
    const result = await db.query(
      `SELECT
         r.id,
         r.rating,
         r.comment,
         r.created_at,
         u.name AS customer_name
       FROM reviews r
       JOIN users u ON u.id = r.customer_id
       WHERE r.provider_id = $1
       ORDER BY r.created_at DESC`,
      [providerId]
    );

    res.json({
      provider_id: parseInt(providerId),
      avg_rating: providerCheck.rows[0].avg_rating,
      total_reviews: result.rows.length,
      reviews: result.rows,
    });

  } catch (error) {
    console.error('Get reviews error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;