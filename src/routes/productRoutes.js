const express = require('express');
const { body, query } = require('express-validator');
const { auth, checkPermission } = require('../middleware/auth');
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getLowStockProducts,
} = require('../controllers/productController');

const router = express.Router();

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: Get all products for the authenticated cafe owner
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of products
 */
router.get(
  '/',
  auth,
  checkPermission(['manage_products']),
  getAllProducts
);

/**
 * @swagger
 * /api/products/search:
 *   get:
 *     tags: [Products]
 *     summary: Search products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 */
router.get(
  '/search',
  auth,
  checkPermission(['manage_products']),
  searchProducts
);

/**
 * @swagger
 * /api/products/low-stock:
 *   get:
 *     tags: [Products]
 *     summary: Get low stock products
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/low-stock',
  auth,
  checkPermission(['manage_products']),
  getLowStockProducts
);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get product by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get(
  '/:id',
  auth,
  checkPermission(['manage_products']),
  getProductById
);

/**
 * @swagger
 * /api/products:
 *   post:
 *     tags: [Products]
 *     summary: Create a new product
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - price
 *               - category
 *               - cost
 *               - unit
 */
router.post(
  '/',
  auth,
  checkPermission(['manage_products']),
  [
    body('code').trim().notEmpty().withMessage('Product code is required'),
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('cost').isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
    body('unit').trim().notEmpty().withMessage('Unit is required'),
    body('stockQuantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be a positive number'),
    body('minimumStock').optional().isInt({ min: 0 }).withMessage('Minimum stock must be a positive number'),
    body('supplier').optional().isObject(),
    body('tags').optional().isArray(),
  ],
  createProduct
);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Update a product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.put(
  '/:id',
  auth,
  checkPermission(['manage_products']),
  [
    body('code').optional().trim().notEmpty().withMessage('Product code cannot be empty'),
    body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
    body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
    body('unit').optional().trim().notEmpty().withMessage('Unit cannot be empty'),
    body('stockQuantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be a positive number'),
    body('minimumStock').optional().isInt({ min: 0 }).withMessage('Minimum stock must be a positive number'),
    body('supplier').optional().isObject(),
    body('tags').optional().isArray(),
    body('isActive').optional().isBoolean(),
  ],
  updateProduct
);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete a product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete(
  '/:id',
  auth,
  checkPermission(['manage_products']),
  deleteProduct
);

module.exports = router; 