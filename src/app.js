/**
 * Main server application
 * Enhanced AI Chatbot with RAG - Clean Architecture Implementation
 */

const express = require('express');
const path = require('path');
const { config, validateConfig } = require('./config');
const logger = require('./utils/logger');
const { 
  requestLogger, 
  errorHandler, 
  corsHandler, 
  securityHeaders, 
  healthCheck 
} = require('./middleware');

// Services
const RAGService = require('./services/ragService');
const OllamaService = require('./services/ollamaService');
const ChatService = require('./services/chatService');

// Routes
const createApiRoutes = require('./routes/api');

class Application {
  constructor() {
    this.app = express();
    this.server = null;
    this.isShuttingDown = false;
    
    // Initialize services
    this.ragService = new RAGService();
    this.ollamaService = new OllamaService();
    this.chatService = new ChatService(this.ragService, this.ollamaService);
  }

  /**
   * Initialize the application
   */
  async initialize() {
    try {
      logger.info('Starting AI Chatbot application...');
      
      // Validate configuration
      validateConfig();
      logger.info('Configuration validated successfully');

      // Setup middleware
      this.setupMiddleware();
      
      // Setup routes
      this.setupRoutes();
      
      // Initialize services
      await this.initializeServices();
      
      logger.info('Application initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize application', { error: error.message });
      throw error;
    }
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // Health check (before other middleware for performance)
    this.app.use(healthCheck);
    
    // Security and CORS
    this.app.use(securityHeaders);
    this.app.use(corsHandler);
    
    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Logging
    this.app.use(requestLogger);
    
    // Static files
    this.app.use(express.static(path.join(__dirname, '../public')));
  }

  /**
   * Setup application routes
   */
  setupRoutes() {
    // API routes
    this.app.use('/api', createApiRoutes(this.chatService));
    
    // Serve main HTML file
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../index.html'));
    });
    
    // Legacy health endpoint (for backward compatibility)
    this.app.get('/health', async (req, res, next) => {
      try {
        const healthStatus = await this.chatService.getHealthStatus();
        res.json(healthStatus);
      } catch (error) {
        next(error);
      }
    });
    
    // Legacy chat endpoint (for backward compatibility)
    this.app.post('/chat', async (req, res, next) => {
      try {
        const response = await this.chatService.processMessage(req.body);
        res.json(response);
      } catch (error) {
        next(error);
      }
    });
    
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Endpoint not found',
          path: req.originalUrl
        }
      });
    });
    
    // Error handler (must be last)
    this.app.use(errorHandler);
  }

  /**
   * Initialize all services
   */
  async initializeServices() {
    try {
      logger.info('Initializing services...');
      
      // Initialize services in parallel for better performance
      await this.chatService.initialize();
      
      logger.info('All services initialized successfully');
      
    } catch (error) {
      logger.error('Service initialization failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Start the HTTP server
   */
  async start() {
    try {
      await this.initialize();
      
      this.server = this.app.listen(config.server.port, config.server.host, () => {
        logger.info(`🚀 Server running successfully`, {
          port: config.server.port,
          host: config.server.host,
          environment: config.server.environment,
          model: config.ollama.model,
          urls: {
            main: `http://${config.server.host}:${config.server.port}`,
            chat: `http://${config.server.host}:${config.server.port}/api/chat`,
            health: `http://${config.server.host}:${config.server.port}/api/health`
          }
        });
        
        console.log('\n🎉 AI Chatbot is ready!');
        console.log(`📱 Open your browser: http://${config.server.host}:${config.server.port}`);
        console.log(`💬 Chat API: http://${config.server.host}:${config.server.port}/api/chat`);
        console.log(`🏥 Health Check: http://${config.server.host}:${config.server.port}/api/health`);
      });

      // Setup graceful shutdown
      this.setupGracefulShutdown();
      
    } catch (error) {
      logger.error('Failed to start server', { error: error.message });
      process.exit(1);
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      if (this.isShuttingDown) return;
      
      this.isShuttingDown = true;
      logger.info(`Received ${signal}, shutting down gracefully...`);
      
      if (this.server) {
        this.server.close((error) => {
          if (error) {
            logger.error('Error during server shutdown', { error: error.message });
            process.exit(1);
          } else {
            logger.info('Server closed successfully');
            process.exit(0);
          }
        });
      } else {
        process.exit(0);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { 
        reason: reason instanceof Error ? reason.message : reason,
        promise: promise.toString()
      });
      process.exit(1);
    });
  }

  /**
   * Get application instance (for testing)
   */
  getApp() {
    return this.app;
  }
}

// Start the application if this file is run directly
if (require.main === module) {
  const app = new Application();
  app.start().catch((error) => {
    logger.error('Failed to start application', { error: error.message });
    process.exit(1);
  });
}

module.exports = Application;
