/**
 * API Routes for the chat application
 */

const express = require('express');
const { createRateLimiter } = require('../middleware');
const logger = require('../utils/logger');

const createRoutes = (chatService) => {
  const router = express.Router();

  // Apply rate limiting to chat endpoint
  const chatRateLimit = createRateLimiter(60000, 20); // 20 requests per minute

  /**
   * POST /api/chat
   * Main chat endpoint for processing messages
   */
  router.post('/chat', chatRateLimit, async (req, res, next) => {
    try {
      const response = await chatService.processMessage(req.body);
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/health
   * Health check endpoint with detailed service status
   */
  router.get('/health', async (req, res, next) => {
    try {
      const healthStatus = await chatService.getHealthStatus();
      
      const statusCode = healthStatus.status === 'healthy' ? 200 : 
                        healthStatus.status === 'degraded' ? 503 : 500;
      
      res.status(statusCode).json(healthStatus);
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/refresh
   * Refresh the RAG system (admin endpoint)
   */
  router.post('/refresh', async (req, res, next) => {
    try {
      logger.info('Manual refresh requested');
      await chatService.refresh();
      
      res.json({
        message: 'System refreshed successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/status
   * Simple status endpoint for load balancers
   */
  router.get('/status', (req, res) => {
    res.json({
      status: 'operational',
      service: 'AI Chatbot',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  return router;
};

module.exports = createRoutes;
