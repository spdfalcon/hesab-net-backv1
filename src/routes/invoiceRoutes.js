const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { auth } = require('../middleware/auth');
const {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoicePayment,
  cancelInvoice,
  getInvoiceStats,
} = require('../controllers/invoiceController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Invoice:
 *       type: object
 *       required:
 *         - type
 *         - party
 *         - items
 *         - paymentMethod
 *       properties:
 *         type:
 *           type: string
 *           enum: [sale, purchase]
 *         date:
 *           type: string
 *           format: date-time
 *         dueDate:
 *           type: string
 *           format: date-time
 *         party:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [customer, supplier]
 *             name:
 *               type: string
 *             phone:
 *               type: string
 *             email:
 *               type: string
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               product:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: number
 *                 minimum: 0.01
 *               discount:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *         tax:
 *           type: number
 *           minimum: 0
 *         discount:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *         paymentMethod:
 *           type: string
 *           enum: [cash, card, transfer]
 *         paidAmount:
 *           type: number
 *           minimum: 0
 */

// Validation middleware
const invoiceValidation = [
  check('type').isIn(['sale', 'purchase']).withMessage('Invalid invoice type'),
  check('date').optional().isISO8601().withMessage('Invalid date format'),
  check('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  check('party.type').isIn(['customer', 'supplier']).withMessage('Invalid party type'),
  check('party.name').notEmpty().withMessage('Party name is required'),
  check('party.phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
  check('party.email').optional().isEmail().withMessage('Invalid email format'),
  check('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  check('items.*.product').isMongoId().withMessage('Invalid product ID'),
  check('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Invalid quantity'),
  check('items.*.discount').optional().isFloat({ min: 0, max: 100 }).withMessage('Invalid discount percentage'),
  check('tax').optional().isFloat({ min: 0 }).withMessage('Invalid tax amount'),
  check('discount').optional().isFloat({ min: 0, max: 100 }).withMessage('Invalid discount percentage'),
  check('paymentMethod').isIn(['cash', 'card', 'transfer']).withMessage('Invalid payment method'),
  check('paidAmount').optional().isFloat({ min: 0 }).withMessage('Invalid paid amount'),
];

const paymentValidation = [
  check('paidAmount').isFloat({ min: 0 }).withMessage('Invalid paid amount'),
  check('paymentMethod').isIn(['cash', 'card', 'transfer']).withMessage('Invalid payment method'),
];

/**
 * @swagger
 * /api/invoices:
 *   get:
 *     summary: Get all invoices
 *     tags: [Invoices]
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [sale, purchase]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [confirmed, cancelled]
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [paid, partial, unpaid]
 *     responses:
 *       200:
 *         description: List of invoices
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Invoice'
 */
router.get('/', auth, getAllInvoices);

/**
 * @swagger
 * /api/invoices/stats:
 *   get:
 *     summary: Get invoice statistics
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Invoice statistics
 */
router.get('/stats', auth, getInvoiceStats);

/**
 * @swagger
 * /api/invoices/{id}:
 *   get:
 *     summary: Get invoice by ID
 *     tags: [Invoices]
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
 *         description: Invoice details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Invoice'
 */
router.get('/:id', auth, getInvoiceById);

/**
 * @swagger
 * /api/invoices:
 *   post:
 *     summary: Create a new invoice
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Invoice'
 *     responses:
 *       201:
 *         description: Invoice created successfully
 */
router.post('/', auth, invoiceValidation, createInvoice);

/**
 * @swagger
 * /api/invoices/{id}/payment:
 *   patch:
 *     summary: Update invoice payment
 *     tags: [Invoices]
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
 *             type: object
 *             required:
 *               - paidAmount
 *               - paymentMethod
 *             properties:
 *               paidAmount:
 *                 type: number
 *                 minimum: 0
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, card, transfer]
 *     responses:
 *       200:
 *         description: Payment updated successfully
 */
router.patch('/:id/payment', auth, paymentValidation, updateInvoicePayment);

/**
 * @swagger
 * /api/invoices/{id}/cancel:
 *   patch:
 *     summary: Cancel an invoice
 *     tags: [Invoices]
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
 *         description: Invoice cancelled successfully
 */
router.patch('/:id/cancel', auth, cancelInvoice);

module.exports = router; 