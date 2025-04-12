const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    cost: {
      type: Number,
      required: true,
      min: 0,
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    cafeOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    images: [{
      url: String,
      alt: String,
    }],
    tags: [{
      type: String,
      trim: true,
    }],
    minimumStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    supplier: {
      name: String,
      contact: String,
      email: String,
      phone: String,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for faster searches
productSchema.index({ cafeOwner: 1, code: 1 });
productSchema.index({ cafeOwner: 1, category: 1 });
productSchema.index({ name: 'text', description: 'text' });

const Product = mongoose.model('Product', productSchema);

module.exports = Product; 