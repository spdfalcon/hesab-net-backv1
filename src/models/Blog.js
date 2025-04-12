const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String,
      required: true,
      maxlength: 500,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    featuredImage: {
      url: String,
      alt: String,
      caption: String,
    },
    categories: [{
      type: String,
      required: true,
    }],
    tags: [{
      type: String,
      trim: true,
    }],
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    publishedAt: {
      type: Date,
    },
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
      ogImage: String,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    readTime: {
      type: Number, // in minutes
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better performance
blogSchema.index({ slug: 1 });
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ categories: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ 'seo.keywords': 1 });

// Pre-save hook to generate slug from title
blogSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog; 