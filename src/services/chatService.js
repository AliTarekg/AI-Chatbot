const logger = require('../utils/logger');
const Validator = require('../utils/validator');
const { ValidationError, AppError } = require('../utils/errors');

class ChatService {
  constructor(ragService, ollamaService) {
    this.ragService = ragService;
    this.ollamaService = ollamaService;
    this.greetingPatterns = [
      /^(hi|hello|hey|ازيك|اهلا|مرحبا|السلام عليكم)$/i,
      /^(good morning|good evening|صباح الخير|مساء الخير)$/i,
      /^(how are you|ازيك|كيف حالك|إيه الأخبار)$/i
    ];
    this.quickResponses = {
      ar: {
        greeting: "أهلاً وسهلاً! ازيك؟ أنا مساعدك الذكي في شركة  للحلول التقنية. إيه اللي ممكن أساعدك فيه النهارده؟",
        howAreYou: "الحمد لله تمام! شكراً إنك سألت. إيه اللي ممكن أقدملك من مساعدة؟"
      },
      en: {
        greeting: "Hello! I'm your AI assistant at ATG Solutions. How can I help you today?",
        howAreYou: "I'm doing great, thank you for asking! How can I assist you?"
      }
    };
  }

  async initialize() {
    logger.info('Initializing chat service...');
    try {
      await Promise.all([
        this.ragService.initialize(),
        this.ollamaService.initialize()
      ]);
      logger.info('Chat service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize chat service', { error: error.message });
      throw error;
    }
  }

  getQuickResponse(message) {
    const trimmedMessage = message.trim().toLowerCase();
    const LanguageUtils = require('../utils/languageUtils');
    const langUtils = new LanguageUtils();
    const language = langUtils.detectLanguage(message);
    for (const pattern of this.greetingPatterns) {
      if (pattern.test(trimmedMessage)) {
        const responses = this.quickResponses[language] || this.quickResponses.en;
        if (trimmedMessage.includes('how are you') || 
            trimmedMessage.includes('ازيك') || 
            trimmedMessage.includes('كيف حالك')) {
          return {
            response: responses.howAreYou,
            hasContext: false,
            language,
            sources: [],
            chunkCount: 0,
            responseTime: '0ms',
            model: 'quick-response',
            tokens: 0,
            timestamp: new Date().toISOString(),
            isQuickResponse: true
          };
        }
        return {
          response: responses.greeting,
          hasContext: false,
          language,
          sources: [],
          chunkCount: 0,
          responseTime: '0ms',
          model: 'quick-response',
          tokens: 0,
          timestamp: new Date().toISOString(),
          isQuickResponse: true
        };
      }
    }
    return null;
  }

  getOptimizedOptions(message, hasContext) {
    const messageLength = message.length;
    const isSimpleQuery = messageLength < 50 && !hasContext;
    if (isSimpleQuery) {
      return {
        num_predict: 50,
        num_ctx: 256,
        temperature: 0.1,
        top_k: 3
      };
    }
    if (hasContext) {
      return {
        num_predict: 150,
        num_ctx: 1024,
        temperature: 0.2,
        top_k: 5
      };
    }
    return {
      num_predict: 200,
      num_ctx: 1024,
      temperature: 0.3,
      top_k: 5
    };
  }

  async processMessage(input) {
    try {
      const validatedInput = Validator.validateChatInput(input);
      const { message } = validatedInput;

      logger.info('Processing chat message', { 
        messageLength: message.length,
        preview: message.substring(0, 50) + (message.length > 50 ? '...' : '')
      });

      const quickResponse = this.getQuickResponse(message);
      if (quickResponse) {
        logger.info('Quick response generated successfully', {
          responseLength: quickResponse.response.length,
          hasContext: quickResponse.hasContext,
          language: quickResponse.language,
          responseTime: quickResponse.responseTime
        });

        return quickResponse;
      }

      const relevantChunks = await this.ragService.searchRelevantContext(message);
      const promptInfo = this.ragService.buildContextPrompt(message, relevantChunks);

      logger.debug('Context search completed', {
        chunksFound: relevantChunks.length,
        hasContext: promptInfo.hasContext,
        language: promptInfo.language,
        sources: promptInfo.sources
      });

      const aiResponse = await this.ollamaService.generateResponse(
        promptInfo.systemPrompt,
        promptInfo.userPrompt
      );

      const response = {
        response: aiResponse.content,
        hasContext: promptInfo.hasContext,
        language: promptInfo.language,
        sources: promptInfo.sources || [], 
        chunkCount: promptInfo.chunkCount || 0,
        responseTime: `${aiResponse.responseTime}ms`,
        model: aiResponse.model,
        tokens: aiResponse.tokens,
        timestamp: new Date().toISOString()
      };

      logger.info('Chat response generated successfully', {
        responseLength: response.response.length,
        hasContext: response.hasContext,
        language: response.language,
        responseTime: response.responseTime
      });

      return response;

    } catch (error) {
      logger.error('Failed to process chat message', { 
        error: error.message,
        type: error.constructor.name
      });

      if (error instanceof ValidationError) {
        throw error;
      }

      throw new AppError(`Failed to process message: ${error.message}`, 500, 'CHAT_PROCESSING_ERROR');
    }
  }

  async getHealthStatus() {
    try {
      const [ollamaHealth, ragStats] = await Promise.all([
        this.ollamaService.getHealthStatus(),
        Promise.resolve(this.ragService.getStats())
      ]);

      return {
        status: ollamaHealth.connected && ragStats.isInitialized ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        services: {
          ollama: ollamaHealth,
          rag: {
            status: ragStats.isInitialized ? 'initialized' : 'not-initialized',
            ...ragStats
          }
        }
      };

    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  async refresh() {
    logger.info('Refreshing chat service...');
    
    try {
      await this.ragService.refresh();
      logger.info('Chat service refreshed successfully');
    } catch (error) {
      logger.error('Failed to refresh chat service', { error: error.message });
      throw error;
    }
  }
}

module.exports = ChatService;
