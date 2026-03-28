const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// MIDDLEWARE — runs on every single request before it hits any route

// Allow requests from other origins (your React frontend later)
app.use(cors());

// Allow Express to read JSON data sent in request bodies
app.use(express.json());

// ROUTES — we'll uncomment these as we build each phase
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/providers', require('./routes/providers'));
app.use('/api/search',    require('./routes/search'));
app.use('/api/reviews',   require('./routes/reviews'));

// Health check route — just to confirm the server is alive
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running!',
  });
});

module.exports = app;