const express = require('express');
const cors = require('cors');
require('dotenv').config();
const routes = require('./routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased for base64 image uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/v1', routes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'SERVER_ERROR',
      message: err.message || 'Internal server error'
    }
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
