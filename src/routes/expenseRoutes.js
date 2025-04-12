const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { auth } = require('../middleware/auth');
const {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats,
} = require('../controllers/expenseController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Expense:
 *       type: object
 *       required:
 *         - date
 *         - description
 *         - amount
 *         - category
 *       properties:
 *         date:
 *           type: string
 *           format: date-time
 *         description:
 *           type: string
 *         amount:
 *           type: number
 *           minimum: 0
 *         category:
 *           type: string
 *           enum: [rent, salary, supplies, utilities, maintenance, other]
 *         paymentMethod:
 *           type: string
 *           enum: [cash, card, transfer]
 *         recurring:
 *           type: boolean
 *         recurringPeriod:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *         notes:
 *           type: string
 */

// Validation middleware
const expenseValidation = [
  check('date').isISO8601().withMessage('Invalid date format'),
  check('description').notEmpty().withMessage('Description is required'),
  check('amount').isFloat({ min: 0 }).withMessage('Invalid amount'),
  check('category').isIn(['rent', 'salary', 'supplies', 'utilities', 'maintenance', 'other'])
    .withMessage('Invalid category'),
  check('paymentMethod').optional().isIn(['cash', 'card', 'transfer'])
    .withMessage('Invalid payment method'),
  check('recurring').optional().isBoolean().withMessage('Invalid recurring value'),
  check('recurringPeriod').optional().isIn(['daily', 'weekly', 'monthly', 'yearly'])
    .withMessage('Invalid recurring period'),
];

/**
 * @swagger
 * /api/expenses:
 *   get:
 *     summary: Get all expenses
 *     tags: [Expenses]
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
 *     responses:
 *       200:
 *         description: List of expenses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Expense'
 */
router.get('/', auth, getAllExpenses);

/**
 * @swagger
 * /api/expenses/stats:
 *   get:
 *     summary: Get expense statistics
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expense statistics
 */
router.get('/stats', auth, getExpenseStats);

/**
 * @swagger
 * /api/expenses/{id}:
 *   get:
 *     summary: Get expense by ID
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Expense details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Expense'
 */
router.get('/:id', auth, getExpenseById);

/**
 * @swagger
 * /api/expenses:
 *   post:
 *     summary: Create a new expense
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Expense'
 *     responses:
 *       201:
 *         description: Expense created successfully
 */
router.post('/', auth, expenseValidation, createExpense);

/**
 * @swagger
 * /api/expenses/{id}:
 *   put:
 *     summary: Update an expense
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Expense'
 *     responses:
 *       200:
 *         description: Expense updated successfully
 */
router.put('/:id', auth, expenseValidation, updateExpense);

/**
 * @swagger
 * /api/expenses/{id}:
 *   delete:
 *     summary: Delete an expense
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Expense deleted successfully
 */
router.delete('/:id', auth, deleteExpense);

module.exports = router; 