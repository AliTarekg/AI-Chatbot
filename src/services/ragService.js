/**
 * Enhanced RAG System with improved error handling and modular design
 */

const fs = require('fs').promises;
const path = require('path');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { config } = require('../config');
const logger = require('../utils/logger');
const LanguageUtils = require('../utils/languageUtils');
const { RAGError } = require('../utils/errors');

class RAGSystem {
  constructor() {
    this.documents = [];
    this.isInitialized = false;
    this.dataPath = path.resolve(config.rag.dataPath);
    this.languageUtils = new LanguageUtils();
    this.stats = {
      documentsLoaded: 0,
      chunksCreated: 0,
      lastUpdate: null
    };
  }

  /**
   * Initialize the RAG system
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      logger.debug('RAG system already initialized');
      return;
    }

    try {
      logger.info('Initializing RAG system...');
      
      await this.validateDataPath();
      await this.loadAndProcessDocuments();
      
      this.isInitialized = true;
      this.stats.lastUpdate = new Date().toISOString();
      
      logger.info('RAG system initialized successfully', {
        documents: this.stats.documentsLoaded,
        chunks: this.stats.chunksCreated,
        dataPath: this.dataPath
      });
    } catch (error) {
      logger.error('Failed to initialize RAG system', { error: error.message });
      throw new RAGError(`RAG initialization failed: ${error.message}`, error);
    }
  }

  /**
   * Validate that data path exists and is readable
   * @private
   */
  async validateDataPath() {
    try {
      const stats = await fs.stat(this.dataPath);
      if (!stats.isDirectory()) {
        throw new Error(`Data path is not a directory: ${this.dataPath}`);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Data directory not found: ${this.dataPath}`);
      }
      throw error;
    }
  }

  /**
   * Load and process all documents in the data directory
   * @private
   */
  async loadAndProcessDocuments() {
    try {
      this.documents = [];
      this.stats.documentsLoaded = 0;
      this.stats.chunksCreated = 0;

      const files = await fs.readdir(this.dataPath);
      const textFiles = files.filter(file => file.endsWith('.txt'));

      if (textFiles.length === 0) {
        throw new Error('No text files found in data directory');
      }

      logger.info(`Found ${textFiles.length} text files to process`);

      for (const file of textFiles) {
        await this.processFile(file);
        this.stats.documentsLoaded++;
      }

      logger.info(`Document processing complete`, {
        files: this.stats.documentsLoaded,
        totalChunks: this.stats.chunksCreated
      });

    } catch (error) {
      throw new RAGError(`Failed to load documents: ${error.message}`, error);
    }
  }

  /**
   * Process a single file
   * @param {string} filename - Name of the file to process
   * @private
   */
  async processFile(filename) {
    try {
      const filePath = path.join(this.dataPath, filename);
      const content = await fs.readFile(filePath, 'utf-8');

      if (!content.trim()) {
        logger.warn(`File is empty: ${filename}`);
        return;
      }

      logger.debug(`Processing file: ${filename}`);

      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: config.rag.chunkSize,
        chunkOverlap: config.rag.chunkOverlap,
      });

      const chunks = await textSplitter.splitText(content);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i].trim();
        if (chunk.length > 0) {
          this.documents.push({
            pageContent: chunk,
            metadata: {
              source: filename,
              chunk: i,
              type: filename.replace('.txt', ''),
              wordCount: chunk.split(/\s+/).length,
              language: this.languageUtils.detectLanguage(chunk)
            },
          });
          this.stats.chunksCreated++;
        }
      }

      logger.debug(`Processed ${chunks.length} chunks from ${filename}`);

    } catch (error) {
      logger.error(`Failed to process file: ${filename}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Search for relevant context based on query
   * @param {string} query - Search query
   * @param {number} topK - Number of top results to return
   * @returns {Promise<Array>} Array of relevant chunks
   */
  async searchRelevantContext(query, topK = null) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const actualTopK = topK || config.rag.topK;
      logger.debug(`Searching for context: "${query}"`);

      const keywords = this.languageUtils.extractKeywords(query);
      logger.debug(`Extracted keywords:`, keywords);

      const scoredResults = this.documents.map(doc => {
        const score = this.calculateRelevanceScore(doc, keywords, query);
        return { ...doc, score };
      });

      const results = scoredResults
        .filter(doc => doc.score > config.rag.minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, actualTopK);

      logger.debug(`Found ${results.length} relevant chunks`);

      return results.map(result => ({
        content: result.pageContent,
        source: result.metadata.source,
        type: result.metadata.type,
        score: result.score,
        language: result.metadata.language
      }));

    } catch (error) {
      logger.error('Search failed', { error: error.message, query });
      throw new RAGError(`Context search failed: ${error.message}`, error);
    }
  }

  /**
   * Calculate relevance score for a document
   * @param {Object} doc - Document to score
   * @param {Object} keywords - Extracted keywords object
   * @param {string} originalQuery - Original query text
   * @returns {number} Relevance score
   * @private
   */
  calculateRelevanceScore(doc, keywords, originalQuery) {
    const contentLower = doc.pageContent.toLowerCase();
    const normalizedContent = this.languageUtils.normalizeText(contentLower);
    const queryLower = originalQuery.toLowerCase();

    let score = 0;

    // Keyword matching (primary scoring)
    for (const word of keywords.expanded) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = (normalizedContent.match(regex) || []).length;
      score += matches * 2; // Base score for keyword matches
    }

    // Exact phrase matching (bonus)
    if (normalizedContent.includes(queryLower)) {
      score += 10;
    }

    // Partial phrase matching
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
    for (const word of queryWords) {
      if (normalizedContent.includes(word)) {
        score += 1;
      }
    }

    // Language preference (slight bonus for matching language)
    const queryLanguage = this.languageUtils.detectLanguage(originalQuery);
    if (doc.metadata.language === queryLanguage) {
      score += 0.5;
    }

    // Document type relevance
    const typeRelevance = this.getTypeRelevance(doc.metadata.type, keywords);
    score += typeRelevance;

    return score;
  }

  /**
   * Get relevance boost based on document type
   * @param {string} docType - Document type
   * @param {Object} keywords - Keywords object
   * @returns {number} Relevance boost
   * @private
   */
  getTypeRelevance(docType, keywords) {
    const typeKeywords = {
      'courses': ['course', 'training', 'دورات', 'تدريب'],
      'pricing': ['price', 'cost', 'أسعار', 'تكلفة'],
      'services': ['service', 'خدمات', 'consulting'],
      'contact': ['contact', 'phone', 'اتصال', 'هاتف'],
      'policies': ['policy', 'terms', 'سياسات'],
      'faqs': ['question', 'faq', 'أسئلة']
    };

    const relevantTypes = typeKeywords[docType] || [];
    const hasRelevantKeywords = keywords.expanded.some(keyword => 
      relevantTypes.includes(keyword.toLowerCase())
    );

    return hasRelevantKeywords ? 3 : 0;
  }

  /**
   * Build context prompt for the AI model
   * @param {string} query - User query
   * @param {Array} relevantChunks - Relevant document chunks
   * @returns {Object} Prompt information
   */
  buildContextPrompt(query, relevantChunks) {
    const language = this.languageUtils.detectLanguage(query);
    const isArabic = language === 'ar';

    if (relevantChunks.length === 0) {
      return {
        systemPrompt: this.getNoContextPrompt(isArabic),
        userPrompt: query,
        hasContext: false,
        language
      };
    }

    const contextText = relevantChunks
      .map((chunk, index) => `[Document ${index + 1} - ${chunk.source}]\n${chunk.content}`)
      .join('\n\n---\n\n');

    const systemPrompt = this.getContextualPrompt(contextText, isArabic);
    const userPrompt = this.buildUserPrompt(query, contextText, isArabic);

    return {
      systemPrompt,
      userPrompt,
      hasContext: true,
      sources: [...new Set(relevantChunks.map(chunk => chunk.source))],
      language,
      chunkCount: relevantChunks.length
    };
  }

  /**
   * Get system prompt when no context is available
   * @param {boolean} isArabic - Whether to use Arabic
   * @returns {string} System prompt
   * @private
   */
  getNoContextPrompt(isArabic) {
    if (isArabic) {
      return `أنت مساعد ذكي لشركة ${config.company.name}. أجب على الأسئلة بطريقة مهنية ومهذبة باللهجة المصرية. 
      ${this.languageUtils.getEgyptianToneInstructions()}
      إذا لم تكن لديك معلومات محددة عن الشركة، اعتذر بلطف وقدم المساعدة العامة.`;
    }

    return `You are a helpful AI assistant for ${config.company.name}. Answer questions professionally and courteously. If you don't have specific information about the company, politely let the user know and offer to help with general questions.`;
  }

  /**
   * Get contextual system prompt
   * @param {string} contextText - Context from documents
   * @param {boolean} isArabic - Whether to use Arabic
   * @returns {string} System prompt
   * @private
   */
  getContextualPrompt(contextText, isArabic) {
    if (isArabic) {
      return `أنت مساعد ذكي لشركة ${config.company.name}. استخدم المعلومات التالية للإجابة على سؤال المستخدم بدقة ومهنية باللهجة المصرية.

معلومات الشركة:
${contextText}

تعليمات:
- أجب بناءً على المعلومات المقدمة بشكل أساسي
- كن مهنياً ومفيداً ومختصراً
- استخدم اللهجة المصرية الودودة والمهنية
${this.languageUtils.getEgyptianToneInstructions()}
- إذا لم يكن بإمكانك الإجابة بالكامل من المعلومات المتاحة، اعترف بذلك وقدم ما تستطيع
- حافظ على نبرة ودودة ومهنية`;
    }

    return `You are a helpful AI assistant for ${config.company.name}. Use the following company information to answer the user's question accurately and professionally.

COMPANY CONTEXT:
${contextText}

Instructions:
- Answer based primarily on the provided company information
- Be professional, helpful, and concise
- If the question cannot be fully answered with the provided context, acknowledge this and provide what information you can
- Always maintain a friendly, professional tone
- If asked about pricing or specific details, refer to the exact information provided`;
  }

  /**
   * Build enhanced user prompt with context
   * @param {string} query - Original query
   * @param {string} contextText - Context information
   * @param {boolean} isArabic - Whether query is in Arabic
   * @returns {string} Enhanced user prompt
   * @private
   */
  buildUserPrompt(query, contextText, isArabic) {
    if (isArabic) {
      return `بناءً على معلومات الشركة المقدمة أعلاه:

سؤال المستخدم: ${query}

يرجى الإجابة باستخدام المعلومات المحددة للشركة المقدمة أعلاه.`;
    }

    return `Based on the company information provided above:

User question: ${query}

Please answer using the specific company information provided above.`;
  }

  /**
   * Get system statistics
   * @returns {Object} System statistics
   */
  getStats() {
    return {
      ...this.stats,
      isInitialized: this.isInitialized,
      documentsInMemory: this.documents.length,
      dataPath: this.dataPath
    };
  }

  /**
   * Refresh the document cache
   * @returns {Promise<void>}
   */
  async refresh() {
    logger.info('Refreshing RAG system...');
    this.isInitialized = false;
    await this.initialize();
  }
}

module.exports = RAGSystem;
