const { Ollama } = require('ollama');
const { config } = require('../config');
const logger = require('../utils/logger');
const { OllamaError } = require('../utils/errors');

class OllamaService {
  constructor() {
    this.client = new Ollama({
      host: config.ollama.baseUrl,
    });
    this.isConnected = false;
    this.availableModels = [];
  }

  async initialize() {
    try {
      logger.info('Initializing Ollama service...');
      await this.checkConnection();
      await this.loadAvailableModels();
      this.isConnected = true;
      logger.info('Ollama service initialized successfully', {
        baseUrl: config.ollama.baseUrl,
        model: config.ollama.model,
        modelsAvailable: this.availableModels.length
      });
    } catch (error) {
      logger.error('Failed to initialize Ollama service', { error: error.message });
      throw new OllamaError(`Ollama initialization failed: ${error.message}`, error);
    }
  }

  async checkConnection() {
    try {
      await this.client.list();
      logger.debug('Ollama connection successful');
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to Ollama server at ${config.ollama.baseUrl}. Make sure Ollama is running.`);
      }
      throw error;
    }
  }

  async loadAvailableModels() {
    try {
      const response = await this.client.list();
      this.availableModels = response.models.map(model => model.name);
      
      const hasRequiredModel = this.availableModels.some(model => 
        model.includes(config.ollama.model)
      );

      if (!hasRequiredModel) {
        logger.warn(`Required model '${config.ollama.model}' not found`, {
          available: this.availableModels
        });
      }

    } catch (error) {
      throw new OllamaError(`Failed to load available models: ${error.message}`, error);
    }
  }

  async generateResponse(systemPrompt, userPrompt, options = {}) {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      logger.debug('Generating AI response...', {
        model: config.ollama.model,
        systemPromptLength: systemPrompt.length,
        userPromptLength: userPrompt.length
      });

      const startTime = Date.now();

      const response = await this.client.chat({
        model: config.ollama.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        stream: false,
        options: {
          ...config.ollama.options,
          ...options
        }
      });

      const responseTime = Date.now() - startTime;
      const content = response.message?.content || '';

      logger.debug('AI response generated', {
        responseTime: `${responseTime}ms`,
        responseLength: content.length
      });

      return {
        content,
        responseTime,
        model: config.ollama.model,
        tokens: response.eval_count || 0,
        success: true
      };

    } catch (error) {
      logger.error('Failed to generate response', { 
        error: error.message,
        model: config.ollama.model
      });

      throw new OllamaError(`Response generation failed: ${error.message}`, error);
    }
  }

  isModelAvailable(modelName = null) {
    const targetModel = modelName || config.ollama.model;
    return this.availableModels.some(model => model.includes(targetModel));
  }

  async getHealthStatus() {
    try {
      if (!this.isConnected) {
        return {
          status: 'disconnected',
          connected: false,
          error: 'Service not initialized'
        };
      }

      await this.client.list();
      
      return {
        status: 'healthy',
        connected: true,
        baseUrl: config.ollama.baseUrl,
        model: config.ollama.model,
        modelAvailable: this.isModelAvailable(),
        modelsCount: this.availableModels.length
      };

    } catch (error) {
      return {
        status: 'error',
        connected: false,
        error: error.message
      };
    }
  }

  getAvailableModels() {
    return [...this.availableModels];
  }
}

module.exports = OllamaService;
