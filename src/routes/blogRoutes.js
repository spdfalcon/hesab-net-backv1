const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { auth, checkRole } = require('../middleware/auth');
const {
  getAllPosts,
  getPublicPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  incrementViewCount,
  getBlogStats,
} = require('../controllers/blogController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Blog:
 *       type: object
 *       required:
 *         - title
 *         - content
 *         - excerpt
 *         - categories
 *         - readTime
 *       properties:
 *         title:
 *           type: string
 *         slug:
 *           type: string
 *         content:
 *           type: string
 *         excerpt:
 *           type: string
 *           maxLength: 500
 *         author:
 *           type: string
 *           format: uuid
 *         featuredImage:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *             alt:
 *               type: string
 *             caption:
 *               type: string
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         status:
 *           type: string
 *           enum: [draft, published, archived]
 *         publishedAt:
 *           type: string
 *           format: date-time
 *         seo:
 *           type: object
 *           properties:
 *             metaTitle:
 *               type: string
 *             metaDescription:
 *               type: string
 *             keywords:
 *               type: array
 *               items:
 *                 type: string
 *             ogImage:
 *               type: string
 *         readTime:
 *           type: number
 *           minimum: 1
 */

// Validation middleware
const blogValidation = [
  check('title').notEmpty().withMessage('Title is required'),
  check('content').notEmpty().withMessage('Content is required'),
  check('excerpt').notEmpty().isLength({ max: 500 }).withMessage('Excerpt is required and must be less than 500 characters'),
  check('categories').isArray({ min: 1 }).withMessage('At least one category is required'),
  check('readTime').isInt({ min: 1 }).withMessage('Valid read time is required'),
  check('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Invalid status'),
  check('tags').optional().isArray().withMessage('Tags must be an array'),
  check('seo').optional().isObject().withMessage('SEO must be an object'),
  check('seo.metaTitle').optional().isString().withMessage('Meta title must be a string'),
  check('seo.metaDescription').optional().isString().withMessage('Meta description must be a string'),
  check('seo.keywords').optional().isArray().withMessage('SEO keywords must be an array'),
];

/**
 * @swagger
 * /api/blog:
 *   get:
 *     summary: Get all blog posts (admin)
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of all blog posts
 */
router.get('/', auth, checkRole(['super_admin', 'admin', 'editor']), getAllPosts);

/**
 * @swagger
 * /api/blog/public:
 *   get:
 *     summary: Get published blog posts
 *     tags: [Blog]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of published blog posts
 */
router.get('/public', getPublicPosts);

/**
 * @swagger
 * /api/blog/stats:
 *   get:
 *     summary: Get blog statistics
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Blog statistics
 */
router.get('/stats', auth, checkRole(['super_admin', 'admin', 'editor']), getBlogStats);

/**
 * @swagger
 * /api/blog/{slug}:
 *   get:
 *     summary: Get blog post by slug
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blog post details
 */
router.get('/:slug', getPostBySlug);

/**
 * @swagger
 * /api/blog:
 *   post:
 *     summary: Create a new blog post
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Blog'
 *     responses:
 *       201:
 *         description: Blog post created successfully
 */
router.post('/', auth, checkRole(['super_admin', 'admin', 'editor']), blogValidation, createPost);

/**
 * @swagger
 * /api/blog/{slug}:
 *   put:
 *     summary: Update a blog post
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Blog'
 *     responses:
 *       200:
 *         description: Blog post updated successfully
 */
router.put('/:slug', auth, checkRole(['super_admin', 'admin', 'editor']), blogValidation, updatePost);

/**
 * @swagger
 * /api/blog/{slug}:
 *   delete:
 *     summary: Delete a blog post
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blog post deleted successfully
 */
router.delete('/:slug', auth, checkRole(['super_admin', 'admin']), deletePost);

/**
 * @swagger
 * /api/blog/{slug}/view:
 *   post:
 *     summary: Increment blog post view count
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: View count incremented successfully
 */
router.post('/:slug/view', incrementViewCount);

module.exports = router; 