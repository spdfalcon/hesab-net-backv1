const Product = require('../models/Product');
const { validationResult } = require('express-validator');

// Get all products for a cafe owner
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ cafeOwner: req.user.id });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      cafeOwner: req.user.id,
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
};

// Create new product
const createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      code,
      name,
      price,
      category,
      description,
      cost,
      stockQuantity,
      unit,
      minimumStock,
      supplier,
      tags,
    } = req.body;

    const product = new Product({
      code,
      name,
      price,
      category,
      description,
      cost,
      stockQuantity,
      unit,
      minimumStock,
      supplier,
      tags,
      cafeOwner: req.user.id,
    });

    await product.save();
    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Product code already exists' });
    }
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findOne({
      _id: req.params.id,
      cafeOwner: req.user.id,
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updateFields = [
      'code',
      'name',
      'price',
      'category',
      'description',
      'cost',
      'stockQuantity',
      'unit',
      'isActive',
      'minimumStock',
      'supplier',
      'tags',
      'images',
    ];

    updateFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();
    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Product code already exists' });
    }
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      cafeOwner: req.user.id,
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.remove();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};

// Search products
const searchProducts = async (req, res) => {
  try {
    const { query, category } = req.query;
    const searchCriteria = { cafeOwner: req.user.id };

    if (query) {
      searchCriteria.$text = { $search: query };
    }

    if (category) {
      searchCriteria.category = category;
    }

    const products = await Product.find(searchCriteria);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error searching products', error: error.message });
  }
};

// Get low stock products
const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      cafeOwner: req.user.id,
      stockQuantity: { $lte: '$minimumStock' },
      isActive: true,
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching low stock products', error: error.message });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getLowStockProducts,
}; 