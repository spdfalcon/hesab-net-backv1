const app = require('./app');
const mongoose = require('mongoose');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Vercel specific: Skip MongoDB connection in production
if (process.env.VERCEL_ENV === 'production') {
  console.log('Running on Vercel, skipping direct MongoDB connection');
  module.exports = app;
} else {
  if (!MONGODB_URI) {
    console.error('FATAL ERROR: MONGODB_URI is not defined');
    process.exit(1);
  }

  // Connect to MongoDB
  mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });
} 