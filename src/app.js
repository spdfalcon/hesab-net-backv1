const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const saleRoutes = require('./routes/saleRoutes');
const cashRegisterRoutes = require('./routes/cashRegisterRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const blogRoutes = require('./routes/blogRoutes');

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'کافه مدیریت API',
      version: '1.0.0',
      description: 'API documentation for Cafe Management System',
    },
    servers: [
      {
        url: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${process.env.PORT || 5000}`,
        description: process.env.VERCEL_URL ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{
      bearerAuth: [],
    }],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Base API path
const API_BASE = '/api';

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes with base path
app.use(`${API_BASE}/auth`, authRoutes);
app.use(`${API_BASE}/users`, userRoutes);
app.use(`${API_BASE}/products`, productRoutes);
app.use(`${API_BASE}/sales`, saleRoutes);
app.use(`${API_BASE}/cash-register`, cashRegisterRoutes);
app.use(`${API_BASE}/invoices`, invoiceRoutes);
app.use(`${API_BASE}/expenses`, expenseRoutes);
app.use(`${API_BASE}/blog`, blogRoutes);

// Root endpoint
app.get('/', (req, res) => {
  const baseUrl = process.env.VERCEL_URL ? 
    `https://${process.env.VERCEL_URL}` : 
    `http://localhost:${process.env.PORT || 5000}`;

  res.json({ 
    message: 'Welcome to Cafe Management System API',
    documentation: `${baseUrl}/api-docs`,
    health: `${baseUrl}/health`,
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

module.exports = app; 