const app = require('./app');
const mongoose = require('mongoose');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe-management';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  if (process.env.VERCEL_URL) {
    // در محیط Vercel نیازی به app.listen نیست
    console.log('Running on Vercel');
  } else {
    // در محیط توسعه محلی از app.listen استفاده می‌کنیم
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

// برای Vercel نیاز است که app را export کنیم
module.exports = app; 