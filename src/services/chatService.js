const logger = require('../utils/logger');
const Validator = require('../utils/validator');
const { ValidationError, AppError } = require('../utils/errors');

class ChatService {
  constructor(ragService, ollamaService) {
    this.ragService = ragService;
    this.ollamaService = ollamaService;    this.greetingPatterns = [
      /^(hi|hello|hey|ازيك|اهلا|أهلا|مرحبا|مرحباً|السلام عليكم|سلام)$/i,
      /^(good morning|good evening|صباح الخير|مساء الخير)$/i,
      /^(how are you|ازيك|ازاي|كيف حالك|إيه الأخبار|عامل ايه|ايه اخبارك)$/i,
      /^(what'?s up|sup|ايه اخبارك|إيه أخبارك)$/i
    ];
    this.quickResponses = {
      ar: {
        greeting: "أهلاً وسهلاً! ازيك؟ أنا مساعدك الذكي في شركة ATG Solutions للحلول التقنية. إيه اللي ممكن أساعدك فيه النهارده؟",
        howAreYou: "الحمد لله تمام! شكراً إنك سألت. قولي عايز إيه وأنا في خدمتك.",
        morning: "صباح الخير! إن شاء الله يومك يكون جميل. عايز مساعدة في حاجة؟",
        evening: "مساء الخير! أنا هنا لو محتاج أي حاجة."
      },
      en: {
        greeting: "Hello! Welcome to ATG Solutions. I'm your AI assistant. How can I help you today?",
        howAreYou: "I'm doing great, thank you for asking! What can I help you with?",
        morning: "Good morning! I hope you have a wonderful day. How may I assist you?",
        evening: "Good evening! How can I help you today?"
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
        
        if (trimmedMessage.includes('morning') || trimmedMessage.includes('صباح')) {
          return {
            response: responses.morning || responses.greeting,
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
        
        if (trimmedMessage.includes('evening') || trimmedMessage.includes('مساء')) {
          return {
            response: responses.evening || responses.greeting,
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
        
        if (trimmedMessage.includes('how are you') || 
            trimmedMessage.includes('ازيك') || 
            trimmedMessage.includes('ازاي') ||
            trimmedMessage.includes('عامل') ||
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
    const wordCount = message.split(/\s+/).length;
    
    if (messageLength < 30 && !hasContext) {
      return {
        num_predict: 40,
        num_ctx: 256,
        temperature: 0.1,
        top_k: 2,
        top_p: 0.3
      };
    }
    
    if (messageLength < 100 && !hasContext) {
      return {
        num_predict: 80,
        num_ctx: 512,
        temperature: 0.15,
        top_k: 3,
        top_p: 0.4
      };
    }
    
    if (hasContext && wordCount < 15) {
      return {
        num_predict: 120,
        num_ctx: 1024,
        temperature: 0.2,
        top_k: 4,
        top_p: 0.5
      };
    }
    
    if (hasContext) {
      return {
        num_predict: 180,
        num_ctx: 2048,
        temperature: 0.25,
        top_k: 5,
        top_p: 0.6
      };
    }
    
    return {
      num_predict: 150,
      num_ctx: 1024,
      temperature: 0.3,
      top_k: 5,
      top_p: 0.7
    };
  }
  async processMessage(input) {
    const startTime = Date.now();
    
    try {
      const validatedInput = Validator.validateChatInput(input);
      const { message } = validatedInput;

      const quickResponse = this.getQuickResponse(message);
      if (quickResponse) {
        return quickResponse;
      }

      const relevantChunks = await this.ragService.searchRelevantContext(message);
      const promptInfo = this.ragService.buildContextPrompt(message, relevantChunks);

      const optimizedOptions = this.getOptimizedOptions(message, promptInfo.hasContext);

      const aiResponse = await this.ollamaService.generateResponse(
        promptInfo.systemPrompt,
        promptInfo.userPrompt,
        optimizedOptions
      );

      const totalTime = Date.now() - startTime;

      const response = {
        response: aiResponse.content,
        hasContext: promptInfo.hasContext,
        language: promptInfo.language,
        sources: promptInfo.sources || [], 
        chunkCount: promptInfo.chunkCount || 0,
        responseTime: `${totalTime}ms`,
        model: aiResponse.model,
        tokens: aiResponse.tokens,
        timestamp: new Date().toISOString()
      };

      logger.info('Chat response generated', {
        totalTime: `${totalTime}ms`,
        hasContext: response.hasContext,
        language: response.language
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
