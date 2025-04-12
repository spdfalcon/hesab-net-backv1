const express = require('express');
const { body, query } = require('express-validator');
const { auth, checkPermission } = require('../middleware/auth');
const {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  getCashRegisterSummary,
} = require('../controllers/cashRegisterController');

const router = express.Router();

/**
 * @swagger
 * /api/cash-register:
 *   get:
 *     tags: [Cash Register]
 *     summary: Get all transactions with optional filters
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
 *         name: category
 *         schema:
 *           type: string
 *           enum: [sale, expense, refund, other]
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *           enum: [cash, card, transfer]
 */
router.get(
  '/',
  auth,
  checkPermission(['manage_cash_register']),
  getAllTransactions
);

/**
 * @swagger
 * /api/cash-register/summary:
 *   get:
 *     tags: [Cash Register]
 *     summary: Get cash register summary
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
  '/summary',
  auth,
  checkPermission(['manage_cash_register']),
  getCashRegisterSummary
);

/**
 * @swagger
 * /api/cash-register/{id}:
 *   get:
 *     tags: [Cash Register]
 *     summary: Get transaction by ID
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
  checkPermission(['manage_cash_register']),
  getTransactionById
);

/**
 * @swagger
 * /api/cash-register:
 *   post:
 *     tags: [Cash Register]
 *     summary: Create a new transaction
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionType
 *               - paymentMethod
 *               - amount
 *               - description
 *               - category
 */
router.post(
  '/',
  auth,
  checkPermission(['manage_cash_register']),
  [
    body('transactionType').isIn(['deposit', 'withdrawal']).withMessage('Invalid transaction type'),
    body('paymentMethod').isIn(['cash', 'card', 'transfer']).withMessage('Invalid payment method'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').isIn(['sale', 'expense', 'refund', 'other']).withMessage('Invalid category'),
    body('reference').optional().isObject(),
    body('reference.type').optional().isIn(['sale', 'expense', 'other']).withMessage('Invalid reference type'),
    body('reference.id').optional().isMongoId().withMessage('Invalid reference ID'),
    body('notes').optional().trim(),
  ],
  createTransaction
);

module.exports = router; 