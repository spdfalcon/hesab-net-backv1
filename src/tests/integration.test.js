const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const Blog = require('../models/Blog');
const { generateToken } = require('../config/jwt');

let mongoServer;
let adminToken;
let testUser;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  testUser = await User.create({
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin',
  });

  adminToken = generateToken(testUser);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('API Integration Tests', () => {
  describe('User and Blog Integration', () => {
    it('should create a user and allow them to create and manage blog posts', async () => {
      // Create a new editor user
      const editorData = {
        name: 'Test Editor',
        email: 'editor@test.com',
        password: 'password123',
        role: 'editor',
      };

      const createUserRes = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(editorData);

      expect(createUserRes.status).toBe(201);
      const editorId = createUserRes.body.user._id;

      // Login as editor
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: editorData.email,
          password: editorData.password,
        });

      expect(loginRes.status).toBe(200);
      const editorToken = loginRes.body.token;

      // Create a blog post as editor
      const blogData = {
        title: 'Integration Test Post',
        content: 'Test content',
        excerpt: 'Test excerpt',
        categories: ['test'],
        readTime: 5,
        status: 'draft',
      };

      const createBlogRes = await request(app)
        .post('/api/blog')
        .set('Authorization', `Bearer ${editorToken}`)
        .send(blogData);

      expect(createBlogRes.status).toBe(201);
      const blogSlug = createBlogRes.body.post.slug;

      // Update the blog post
      const updateRes = await request(app)
        .put(`/api/blog/${blogSlug}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          ...blogData,
          title: 'Updated Title',
          status: 'published',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.post.title).toBe('Updated Title');
      expect(updateRes.body.post.status).toBe('published');

      // Verify the post appears in public posts
      const publicPostsRes = await request(app)
        .get('/api/blog/public');

      expect(publicPostsRes.status).toBe(200);
      expect(publicPostsRes.body.some(post => post.slug === blogSlug)).toBeTruthy();

      // Try to delete as editor (should fail)
      const deleteAsEditorRes = await request(app)
        .delete(`/api/blog/${blogSlug}`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(deleteAsEditorRes.status).toBe(403);

      // Delete as admin (should succeed)
      const deleteAsAdminRes = await request(app)
        .delete(`/api/blog/${blogSlug}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteAsAdminRes.status).toBe(200);
    });
  });

  describe('Authentication and Authorization', () => {
    it('should handle invalid tokens and permissions correctly', async () => {
      // Try accessing protected route without token
      const noTokenRes = await request(app)
        .get('/api/blog');
      
      expect(noTokenRes.status).toBe(401);

      // Try accessing protected route with invalid token
      const invalidTokenRes = await request(app)
        .get('/api/blog')
        .set('Authorization', 'Bearer invalid.token.here');
      
      expect(invalidTokenRes.status).toBe(401);

      // Create regular user
      const userData = {
        name: 'Regular User',
        email: 'user@test.com',
        password: 'password123',
        role: 'user',
      };

      const createUserRes = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData);

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        });

      const userToken = loginRes.body.token;

      // Try accessing admin-only route with user token
      const userAccessRes = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(userAccessRes.status).toBe(403);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors appropriately', async () => {
      // Try creating blog post with missing required fields
      const invalidBlogRes = await request(app)
        .post('/api/blog')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Post',
          // missing required fields
        });

      expect(invalidBlogRes.status).toBe(400);
      expect(invalidBlogRes.body.errors).toBeDefined();

      // Try creating user with invalid email
      const invalidUserRes = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid User',
          email: 'not-an-email',
          password: 'password123',
          role: 'user',
        });

      expect(invalidUserRes.status).toBe(400);
      expect(invalidUserRes.body.errors).toBeDefined();
    });

    it('should handle duplicate key errors', async () => {
      const userData = {
        name: 'Duplicate User',
        email: 'duplicate@test.com',
        password: 'password123',
        role: 'user',
      };

      // Create user first time
      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData);

      // Try creating user with same email
      const duplicateRes = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData);

      expect(duplicateRes.status).toBe(400);
      expect(duplicateRes.body.message).toContain('duplicate');
    });
  });
}); 