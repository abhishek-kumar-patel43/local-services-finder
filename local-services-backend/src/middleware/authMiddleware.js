const jwt = require('jsonwebtoken');
require('dotenv').config();

// This function will be used to protect any route that needs login
const protect = (req, res, next) => {

  // Step 1: Get the token from the request headers
  // The frontend will send: Authorization: Bearer eyJhbGci...
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // Step 2: If there's no token, block the request
  if (!token) {
    return res.status(401).json({ message: 'No token. Access denied.' });
  }

  // Step 3: Verify the token is valid and not expired
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Step 4: Attach the user info to the request object
    // Now any route using this middleware can access req.user
    req.user = decoded; // contains { id, role }

    // Step 5: Move on to the actual route
    next();

  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Middleware that only allows providers through
const providerOnly = (req, res, next) => {
  if (req.user.role !== 'provider') {
    return res.status(403).json({ message: 'Only providers can do this' });
  }
  next();
};

// Middleware that only allows customers through
const customerOnly = (req, res, next) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({ message: 'Only customers can do this' });
  }
  next();
};

module.exports = { protect, providerOnly, customerOnly };