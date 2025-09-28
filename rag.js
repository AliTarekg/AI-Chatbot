const fs = require('fs').promises;
const path = require('path');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');

class RAGSystem {
    constructor() {
        this.documents = [];
        this.isInitialized = false;
        this.dataPath = path.join(__dirname, 'data');
        
        // Arabic to English keyword mappings
        this.keywordMappings = {
            'أسعار': ['price', 'pricing', 'cost', 'fee'],
            'دورات': ['course', 'courses', 'training', 'bootcamp'],
            'كورسات': ['course', 'courses', 'training', 'bootcamp'],
            'تدريب': ['training', 'course', 'courses', 'bootcamp'],
            'خدمات': ['service', 'services', 'consulting'],
            'منتجات': ['product', 'products', 'software'],
            'اتصال': ['contact', 'contacts', 'phone', 'email'],
            'سياسات': ['policy', 'policies', 'terms'],
            'أسئلة': ['faq', 'faqs', 'question', 'questions'],
            'شركة': ['company', 'overview', 'about'],
            'فريق': ['team', 'employees', 'staff']
        };
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('🔄 Initializing RAG system...');
            
            console.log('📚 Loading and processing documents...');
            await this.loadAndProcessDocuments();

            this.isInitialized = true;
            console.log('✅ RAG system initialized successfully!');
        } catch (error) {
            console.error('❌ Error initializing RAG system:', error);
            throw error;
        }
    }

    async loadAndProcessDocuments() {
        try {
            this.documents = [];
            const files = await fs.readdir(this.dataPath);
            
            // Process each text file in the data directory
            for (const file of files) {
                if (file.endsWith('.txt')) {
                    const filePath = path.join(this.dataPath, file);
                    const content = await fs.readFile(filePath, 'utf-8');
                    
                    console.log(`📄 Processing ${file}...`);
                    
                    // Split the document into chunks
                    const textSplitter = new RecursiveCharacterTextSplitter({
                        chunkSize: 1000,
                        chunkOverlap: 200,
                    });

                    const chunks = await textSplitter.splitText(content);
                    
                    // Create document objects with metadata
                    for (let i = 0; i < chunks.length; i++) {
                        this.documents.push({
                            pageContent: chunks[i],
                            metadata: {
                                source: file,
                                chunk: i,
                                type: file.replace('.txt', ''),
                            },
                        });
                    }
                }
            }

            console.log(`📊 Created ${this.documents.length} document chunks`);
        } catch (error) {
            console.error('❌ Error loading documents:', error);
            throw error;
        }
    }

    async searchRelevantContext(query, topK = 4) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            console.log(`🔍 Searching for context: "${query}"`);
            
            // Simple keyword-based search
            const queryLower = query.toLowerCase();
            let queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
            
            // Expand query with Arabic keyword mappings
            const expandedWords = new Set(queryWords);
            for (const word of queryWords) {
                if (this.keywordMappings[word]) {
                    this.keywordMappings[word].forEach(mappedWord => expandedWords.add(mappedWord));
                }
            }
            queryWords = Array.from(expandedWords);
            
            console.log(`🔍 Expanded keywords: ${queryWords.join(', ')}`);
            
            const scoredResults = this.documents.map(doc => {
                const contentLower = doc.pageContent.toLowerCase();
                let score = 0;
                
                // Score based on keyword matches
                for (const word of queryWords) {
                    const matches = (contentLower.match(new RegExp(word, 'g')) || []).length;
                    score += matches;
                }
                
                // Bonus for exact phrase matches
                if (contentLower.includes(queryLower)) {
                    score += 5;
                }
                
                return { ...doc, score };
            });
            
            // Sort by score and take top K
            const results = scoredResults
                .filter(doc => doc.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, topK);
            
            console.log(`📝 Found ${results.length} relevant chunks`);
            
            return results.map(result => ({
                content: result.pageContent,
                source: result.metadata.source,
                type: result.metadata.type,
            }));
        } catch (error) {
            console.error('❌ Error searching context:', error);
            return [];
        }
    }

    buildContextPrompt(query, relevantChunks) {
        if (relevantChunks.length === 0) {
            return {
                systemPrompt: `You are a helpful AI assistant for ATG Solutions. Answer questions professionally and courteously. If you don't have specific information about the company, politely let the user know and offer to help with general questions.`,
                hasContext: false
            };
        }

        const contextText = relevantChunks
            .map(chunk => `Source: ${chunk.source}\n${chunk.content}`)
            .join('\n\n---\n\n');

        const systemPrompt = `You are a helpful AI assistant for ATG Solutions. Use the following company information to answer the user's question accurately and professionally. 

COMPANY CONTEXT:
${contextText}

Instructions:
- Answer based primarily on the provided company information
- Be professional, helpful, and concise
- If the question cannot be fully answered with the provided context, acknowledge this and provide what information you can
- Always maintain a friendly, professional tone
- If asked about pricing or specific details, refer to the exact information provided`;

        return {
            systemPrompt,
            hasContext: true,
            sources: [...new Set(relevantChunks.map(chunk => chunk.source))]
        };
    }
}

module.exports = RAGSystem;
