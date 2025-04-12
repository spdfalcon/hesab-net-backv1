const app = require('./app');
const mongoose = require('mongoose');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe-management';

// Add root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Hesab-Net API',
    version: '1.0.0',
    documentation: '/api-docs'
  });
});

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    if (process.env.NODE_ENV !== 'production') {
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
      });
    }
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Export for Vercel
module.exports = app; 