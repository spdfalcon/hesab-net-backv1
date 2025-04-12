const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const Blog = require('../models/Blog');
const User = require('../models/User');
const { generateToken } = require('../config/jwt');

let mongoServer;
let adminToken;
let editorToken;
let testUser;
let testBlog;

beforeAll(async () => {
  // Setup in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Create test users
  testUser = await User.create({
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin',
  });

  const editorUser = await User.create({
    name: 'Test Editor',
    email: 'editor@test.com',
    password: 'password123',
    role: 'editor',
  });

  // Generate tokens
  adminToken = generateToken(testUser);
  editorToken = generateToken(editorUser);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Blog.deleteMany({});
  
  // Create a test blog post
  testBlog = await Blog.create({
    title: 'Test Blog Post',
    content: 'Test content',
    excerpt: 'Test excerpt',
    categories: ['test'],
    readTime: 5,
    author: testUser._id,
    status: 'published',
  });
});

describe('Blog API Tests', () => {
  describe('GET /api/blog', () => {
    it('should get all blog posts for admin', async () => {
      const res = await request(app)
        .get('/api/blog')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(1);
    });

    it('should deny access without token', async () => {
      const res = await request(app).get('/api/blog');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/blog/public', () => {
    it('should get published blog posts', async () => {
      const res = await request(app).get('/api/blog/public');
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(1);
    });

    it('should not return draft posts', async () => {
      await Blog.create({
        title: 'Draft Post',
        content: 'Draft content',
        excerpt: 'Draft excerpt',
        categories: ['test'],
        readTime: 5,
        author: testUser._id,
        status: 'draft',
      });

      const res = await request(app).get('/api/blog/public');
      expect(res.body.length).toBe(1);
      expect(res.body[0].status).toBe('published');
    });
  });

  describe('POST /api/blog', () => {
    const newPost = {
      title: 'New Blog Post',
      content: 'New content',
      excerpt: 'New excerpt',
      categories: ['test'],
      readTime: 5,
      status: 'draft',
    };

    it('should create a new blog post', async () => {
      const res = await request(app)
        .post('/api/blog')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newPost);

      expect(res.status).toBe(201);
      expect(res.body.post.title).toBe(newPost.title);
      expect(res.body.post.slug).toBeDefined();
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/blog')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('PUT /api/blog/:slug', () => {
    it('should update an existing blog post', async () => {
      const update = {
        title: 'Updated Title',
        content: testBlog.content,
        excerpt: testBlog.excerpt,
        categories: testBlog.categories,
        readTime: testBlog.readTime,
      };

      const res = await request(app)
        .put(`/api/blog/${testBlog.slug}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(update);

      expect(res.status).toBe(200);
      expect(res.body.post.title).toBe(update.title);
    });

    it('should return 404 for non-existent post', async () => {
      const res = await request(app)
        .put('/api/blog/non-existent')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Title',
          content: 'Content',
          excerpt: 'Excerpt',
          categories: ['test'],
          readTime: 5,
        });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/blog/:slug', () => {
    it('should delete a blog post', async () => {
      const res = await request(app)
        .delete(`/api/blog/${testBlog.slug}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      
      const deletedPost = await Blog.findById(testBlog._id);
      expect(deletedPost).toBeNull();
    });

    it('should not allow editor to delete posts', async () => {
      const res = await request(app)
        .delete(`/api/blog/${testBlog.slug}`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/blog/:slug/view', () => {
    it('should increment view count', async () => {
      const res = await request(app)
        .post(`/api/blog/${testBlog.slug}/view`);

      expect(res.status).toBe(200);
      expect(res.body.viewCount).toBe(1);

      const updatedPost = await Blog.findById(testBlog._id);
      expect(updatedPost.viewCount).toBe(1);
    });
  });
}); 