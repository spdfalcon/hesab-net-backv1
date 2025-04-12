const express = require('express');
const { body, query } = require('express-validator');
const { auth, checkPermission } = require('../middleware/auth');
const {
  getAllSales,
  getSaleById,
  createSale,
  updateSale,
  cancelSale,
  getSalesStats,
} = require('../controllers/saleController');

const router = express.Router();

/**
 * @swagger
 * /api/sales:
 *   get:
 *     tags: [Sales]
 *     summary: Get all sales with optional filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [completed, cancelled, refunded]
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [paid, partial, unpaid]
 */
router.get(
  '/',
  auth,
  checkPermission(['manage_sales']),
  getAllSales
);

/**
 * @swagger
 * /api/sales/stats:
 *   get:
 *     tags: [Sales]
 *     summary: Get sales statistics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 */
router.get(
  '/stats',
  auth,
  checkPermission(['manage_sales']),
  getSalesStats
);

/**
 * @swagger
 * /api/sales/{id}:
 *   get:
 *     tags: [Sales]
 *     summary: Get sale by ID
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
  checkPermission(['manage_sales']),
  getSaleById
);

/**
 * @swagger
 * /api/sales:
 *   post:
 *     tags: [Sales]
 *     summary: Create a new sale
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - paymentMethod
 */
router.post(
  '/',
  auth,
  checkPermission(['manage_sales']),
  [
    body('items').isArray().withMessage('Items must be an array'),
    body('items.*.product').isMongoId().withMessage('Invalid product ID'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('items.*.discount').optional().isFloat({ min: 0, max: 100 }).withMessage('Discount must be between 0 and 100'),
    body('tax').optional().isFloat({ min: 0 }).withMessage('Tax must be a positive number'),
    body('discount').optional().isFloat({ min: 0, max: 100 }).withMessage('Discount must be between 0 and 100'),
    body('paymentMethod').isIn(['cash', 'card', 'transfer', 'credit']).withMessage('Invalid payment method'),
    body('paidAmount').optional().isFloat({ min: 0 }).withMessage('Paid amount must be a positive number'),
    body('customer').optional().isObject(),
    body('customer.name').optional().trim().notEmpty().withMessage('Customer name cannot be empty'),
    body('customer.phone').optional().trim(),
    body('customer.address').optional().trim(),
  ],
  createSale
);

/**
 * @swagger
 * /api/sales/{id}:
 *   put:
 *     tags: [Sales]
 *     summary: Update a sale (payment status only)
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
  checkPermission(['manage_sales']),
  [
    body('paidAmount').optional().isFloat({ min: 0 }).withMessage('Paid amount must be a positive number'),
    body('notes').optional().trim(),
  ],
  updateSale
);

/**
 * @swagger
 * /api/sales/{id}/cancel:
 *   post:
 *     tags: [Sales]
 *     summary: Cancel a sale
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.post(
  '/:id/cancel',
  auth,
  checkPermission(['manage_sales']),
  cancelSale
);

module.exports = router; 