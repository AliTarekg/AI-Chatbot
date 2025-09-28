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

const RAGService = require('./services/ragService');
const OllamaService = require('./services/ollamaService');
const ChatService = require('./services/chatService');

const createApiRoutes = require('./routes/api');

class Application {
  constructor() {
    this.app = express();
    this.server = null;
    this.isShuttingDown = false;
    this.ragService = new RAGService();
    this.ollamaService = new OllamaService();
    this.chatService = new ChatService(this.ragService, this.ollamaService);
  }

  async initialize() {
    try {
      logger.info('Starting AI Chatbot application...');
      validateConfig();
      logger.info('Configuration validated successfully');
      this.setupMiddleware();
      this.setupRoutes();
      await this.initializeServices();
      logger.info('Application initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize application', { error: error.message });
      throw error;
    }
  }

  setupMiddleware() {
    this.app.use(healthCheck);
    this.app.use(securityHeaders);
    this.app.use(corsHandler);
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(requestLogger);
    this.app.use(express.static(path.join(__dirname, '../public')));
  }

  setupRoutes() {
    this.app.use('/api', createApiRoutes(this.chatService));
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../index.html'));
    });
    this.app.get('/health', async (req, res, next) => {
      try {
        const healthStatus = await this.chatService.getHealthStatus();
        res.json(healthStatus);
      } catch (error) {
        next(error);
      }
    });
    this.app.post('/chat', async (req, res, next) => {
      try {
        const response = await this.chatService.processMessage(req.body);
        res.json(response);
      } catch (error) {
        next(error);
      }
    });
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Endpoint not found',
          path: req.originalUrl
        }
      });
    });
    this.app.use(errorHandler);
  }

  async initializeServices() {
    try {
      logger.info('Initializing services...');
      await this.chatService.initialize();
      logger.info('All services initialized successfully');
    } catch (error) {
      logger.error('Service initialization failed', { error: error.message });
      throw error;
    }
  }

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
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('Failed to start server', { error: error.message });
      process.exit(1);
    }
  }

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

  getApp() {
    return this.app;
  }
}

if (require.main === module) {
  const app = new Application();
  app.start().catch((error) => {
    logger.error('Failed to start application', { error: error.message });
    process.exit(1);
  });
}

module.exports = Application;
