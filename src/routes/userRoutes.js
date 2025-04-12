const express = require('express');
const { body } = require('express-validator');
const { auth, checkRole, checkPermission } = require('../middleware/auth');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  changePassword,
  getUserStats,
} = require('../controllers/userController');

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.get(
  '/',
  auth,
  checkPermission(['manage_users']),
  getAllUsers
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
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
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get(
  '/:id',
  auth,
  checkPermission(['manage_users']),
  getUserById
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update user
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
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 */
router.put(
  '/:id',
  auth,
  checkPermission(['manage_users']),
  [
    body('email').optional().isEmail().withMessage('Invalid email'),
    body('role').optional().isIn(['super_admin', 'content_admin', 'cafe_owner', 'staff', 'customer']),
    body('permissions').optional().isArray(),
    body('isActive').optional().isBoolean(),
  ],
  updateUser
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete user
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
  checkRole(['super_admin']),
  deleteUser
);

/**
 * @swagger
 * /api/users/change-password:
 *   post:
 *     tags: [Users]
 *     summary: Change user password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 */
router.post(
  '/change-password',
  auth,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
  ],
  changePassword
);

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     tags: [Users]
 *     summary: Get user statistics
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/stats',
  auth,
  checkRole(['super_admin', 'content_admin']),
  getUserStats
);

module.exports = router; 