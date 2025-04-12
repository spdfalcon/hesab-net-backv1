const Blog = require('../models/Blog');
const { validationResult } = require('express-validator');

// Get all posts (admin/editor)
const getAllPosts = async (req, res) => {
  try {
    const { status, category, tag } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (category) {
      query.categories = category;
    }

    if (tag) {
      query.tags = tag;
    }

    const posts = await Blog.find(query)
      .sort({ createdAt: -1 })
      .populate('author', 'name email');

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blog posts', error: error.message });
  }
};

// Get published posts (public)
const getPublicPosts = async (req, res) => {
  try {
    const { category, tag } = req.query;
    const query = { status: 'published' };

    if (category) {
      query.categories = category;
    }

    if (tag) {
      query.tags = tag;
    }

    const posts = await Blog.find(query)
      .sort({ publishedAt: -1 })
      .populate('author', 'name')
      .select('-seo'); // Exclude SEO data from public response

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blog posts', error: error.message });
  }
};

// Get blog statistics
const getBlogStats = async (req, res) => {
  try {
    const stats = await Blog.aggregate([
      {
        $facet: {
          statusStats: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
          ],
          categoryStats: [
            { $unwind: '$categories' },
            {
              $group: {
                _id: '$categories',
                count: { $sum: 1 },
                views: { $sum: '$viewCount' },
              },
            },
          ],
          tagStats: [
            { $unwind: '$tags' },
            {
              $group: {
                _id: '$tags',
                count: { $sum: 1 },
              },
            },
          ],
          totalViews: [
            {
              $group: {
                _id: null,
                views: { $sum: '$viewCount' },
                avgReadTime: { $avg: '$readTime' },
              },
            },
          ],
          monthlyPosts: [
            {
              $match: {
                publishedAt: { $exists: true },
              },
            },
            {
              $group: {
                _id: {
                  year: { $year: '$publishedAt' },
                  month: { $month: '$publishedAt' },
                },
                count: { $sum: 1 },
                views: { $sum: '$viewCount' },
              },
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 },
          ],
        },
      },
    ]);

    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blog statistics', error: error.message });
  }
};

// Get post by slug
const getPostBySlug = async (req, res) => {
  try {
    const post = await Blog.findOne({ slug: req.params.slug })
      .populate('author', 'name');

    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    // If post is not published, only admin/editor can view it
    if (post.status !== 'published' && (!req.user || !['admin', 'editor'].includes(req.user.role))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blog post', error: error.message });
  }
};

// Create new post
const createPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      content,
      excerpt,
      categories,
      tags,
      featuredImage,
      status,
      seo,
      readTime,
    } = req.body;

    const post = new Blog({
      title,
      content,
      excerpt,
      categories,
      tags,
      featuredImage,
      status,
      seo,
      readTime,
      author: req.user.id,
      publishedAt: status === 'published' ? new Date() : null,
    });

    await post.save();
    res.status(201).json({ message: 'Blog post created successfully', post });
  } catch (error) {
    res.status(500).json({ message: 'Error creating blog post', error: error.message });
  }
};

// Update post
const updatePost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const post = await Blog.findOne({ slug: req.params.slug });
    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    const {
      title,
      content,
      excerpt,
      categories,
      tags,
      featuredImage,
      status,
      seo,
      readTime,
    } = req.body;

    // Update publishedAt if status changes to published
    if (status === 'published' && post.status !== 'published') {
      post.publishedAt = new Date();
    }

    post.title = title;
    post.content = content;
    post.excerpt = excerpt;
    post.categories = categories;
    post.tags = tags;
    post.featuredImage = featuredImage;
    post.status = status;
    post.seo = seo;
    post.readTime = readTime;

    await post.save();
    res.json({ message: 'Blog post updated successfully', post });
  } catch (error) {
    res.status(500).json({ message: 'Error updating blog post', error: error.message });
  }
};

// Delete post
const deletePost = async (req, res) => {
  try {
    const post = await Blog.findOne({ slug: req.params.slug });
    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    await post.deleteOne();
    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting blog post', error: error.message });
  }
};

// Increment view count
const incrementViewCount = async (req, res) => {
  try {
    const post = await Blog.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { viewCount: 1 } },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    res.json({ message: 'View count incremented successfully', viewCount: post.viewCount });
  } catch (error) {
    res.status(500).json({ message: 'Error incrementing view count', error: error.message });
  }
};

module.exports = {
  getAllPosts,
  getPublicPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  incrementViewCount,
  getBlogStats,
}; 