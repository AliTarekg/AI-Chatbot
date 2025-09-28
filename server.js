require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Ollama } = require('ollama');
const RAGSystem = require('./rag');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Ollama client
const ollama = new Ollama({
    host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
});

// Initialize RAG system
const ragSystem = new RAGSystem();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Check if Ollama is available
        const models = await ollama.list();
        const hasDeepSeek = models.models.some(model => 
            model.name.includes('deepseek-r1:8b') || model.name.includes('deepseek-r1')
        );

        res.json({
            status: 'healthy',
            ollama: 'connected',
            model: hasDeepSeek ? 'deepseek-r1:8b available' : 'deepseek-r1:8b not found',
            rag: ragSystem.isInitialized ? 'initialized' : 'not initialized'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Main chat endpoint
app.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                error: 'Message is required and must be a string'
            });
        }

        console.log(`💬 User query: ${message}`);

        // Initialize RAG system if not already done
        if (!ragSystem.isInitialized) {
            await ragSystem.initialize();
        }

        // Search for relevant context
        const relevantChunks = await ragSystem.searchRelevantContext(message);
        
        // Build prompt with context
        const promptInfo = ragSystem.buildContextPrompt(message, relevantChunks);
        
        console.log(`🎯 Using ${relevantChunks.length} relevant chunks`);
        console.log(`📚 Sources: ${promptInfo.sources ? promptInfo.sources.join(', ') : 'none'}`);

        // Generate response using DeepSeek
        const response = await ollama.chat({
            model: process.env.OLLAMA_MODEL || 'deepseek-r1:8b',
            messages: [
                {
                    role: 'system',
                    content: promptInfo.systemPrompt
                },
                {
                    role: 'user',
                    content: message
                }
            ],
            stream: false,
            options: {
                temperature: 0.7,
                top_p: 0.9,
                max_tokens: 1000,
            }
        });

        const botResponse = response.message.content;
        console.log(`🤖 Bot response length: ${botResponse.length} characters`);

        res.json({
            response: botResponse,
            hasContext: promptInfo.hasContext,
            sources: promptInfo.sources || [],
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Chat error:', error);
        
        let errorMessage = 'Sorry, I encountered an error while processing your request.';
        
        if (error.message.includes('connect')) {
            errorMessage = 'Unable to connect to the AI model. Please make sure Ollama is running.';
        } else if (error.message.includes('model')) {
            errorMessage = 'The AI model is not available. Please check if deepseek-r1:8b is installed.';
        }

        res.status(500).json({
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Initialize RAG system on startup
async function initializeServer() {
    try {
        console.log('🚀 Starting Qalaj AI Chatbot Server...');
        console.log(`📊 Model: ${process.env.OLLAMA_MODEL || 'deepseek-r1:8b'}`);
        console.log(`🔗 Ollama URL: ${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}`);
        
        // Test Ollama connection
        const models = await ollama.list();
        console.log(`✅ Ollama connected! Available models: ${models.models.length}`);
        
        // Initialize RAG system in the background
        ragSystem.initialize().catch(error => {
            console.error('⚠️ RAG initialization failed:', error.message);
            console.log('📝 RAG system will be initialized on first request');
        });

        app.listen(port, () => {
            console.log(`🌐 Server running at http://localhost:${port}`);
            console.log(`💬 Chat endpoint: http://localhost:${port}/chat`);
            console.log(`🏥 Health check: http://localhost:${port}/health`);
            console.log('\n🎉 Chatbot is ready! Open your browser and start chatting!');
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        console.log('\n🔧 Troubleshooting tips:');
        console.log('1. Make sure Ollama is running: ollama serve');
        console.log('2. Check if deepseek-r1:8b model is installed: ollama list');
        console.log('3. Install the model if needed: ollama pull deepseek-r1:8b');
        process.exit(1);
    }
}

// Error handling
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down server...');
    process.exit(0);
});

// Start the server
initializeServer();
