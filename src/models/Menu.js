const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  specialOffer: {
    isSpecial: {
      type: Boolean,
      default: false,
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    validUntil: Date,
  },
});

const menuSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    cafeOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [menuItemSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    categories: [{
      name: String,
      description: String,
      order: Number,
    }],
  },
  {
    timestamps: true,
  }
);

// Add index for faster searches
menuSchema.index({ cafeOwner: 1, name: 1 });

const Menu = mongoose.model('Menu', menuSchema);

module.exports = Menu; 