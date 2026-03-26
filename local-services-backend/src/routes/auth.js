const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const router = express.Router();

// ─────────────────────────────────────────
// SIGNUP
// POST /api/auth/signup
// Body: { name, email, password, role }
// ─────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    // Step 1: Pull data out of the request body
    const { name, email, password, role } = req.body;

    // Step 2: Basic validation — make sure nothing is missing
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Step 3: role must be either 'customer' or 'provider'
    if (!['customer', 'provider'].includes(role)) {
      return res.status(400).json({ message: 'Role must be customer or provider' });
    }

    // Step 4: Check if this email is already registered
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Step 5: Hash the password
    // bcrypt turns "mypassword123" into something like "$2a$10$xK8..."
    // The number 10 is the "salt rounds" — higher = more secure but slower
    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 6: Save the new user to the database
    const result = await db.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [name, email, hashedPassword, role]
    );

    const newUser = result.rows[0];

    // Step 7: Create a JWT token for this user
    // The token contains the user's id and role (this is called the "payload")
    const token = jwt.sign(
      { id: newUser.id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // token expires in 7 days
    );

    // Step 8: Send back the token and user info
    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: newUser,
    });

  } catch (error) {
    console.error('Signup error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});


// ─────────────────────────────────────────
// LOGIN
// POST /api/auth/login
// Body: { email, password }
// ─────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Step 1: Check both fields are provided
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Step 2: Find the user by email
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Step 3: Compare the entered password with the hashed one in the database
    // bcrypt.compare() returns true if they match, false if not
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Step 4: Create a JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Step 5: Send back the token (don't send the password back!)
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;