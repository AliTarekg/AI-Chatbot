# AI Chatbot with RAG - Enhanced Documentation

## 🚀 Overview

This is a production-ready AI Chatbot system with Retrieval-Augmented Generation (RAG) capabilities, supporting both English and Arabic (with Egyptian dialect) interactions. The system uses Ollama for local AI model hosting and provides a clean web interface for user interactions.

## ✨ Features

- **Multilingual Support**: English and Arabic (Egyptian dialect)
- **RAG Integration**: Retrieval-Augmented Generation using company documents
- **Local AI Models**: Runs completely offline using Ollama
- **Clean Architecture**: Modular, maintainable code structure
- **Production Ready**: Comprehensive error handling, logging, and monitoring
- **Modern UI**: Responsive web interface with real-time chat
- **API-First**: RESTful API with rate limiting and validation

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI Services   │
│   (HTML/JS)     │◄──►│   (Express)     │◄──►│   (Ollama)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   RAG System    │
                       │   (Documents)   │
                       └─────────────────┘
```

### Key Components

1. **Application Layer** (`src/app.js`): Main application orchestrator
2. **Services Layer**: 
   - `ChatService`: Orchestrates chat flow
   - `OllamaService`: AI model interactions
   - `RAGService`: Document retrieval and context building
3. **Utilities Layer**: Logging, validation, language processing
4. **API Layer**: RESTful endpoints with middleware
5. **Configuration Layer**: Centralized config management

## 📋 Prerequisites

### System Requirements
- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **RAM**: Minimum 8GB (16GB recommended for larger models)
- **Storage**: 10GB free space for models
- **OS**: Windows 10/11, macOS, or Linux

### Required Software
- **Ollama**: Local AI model hosting platform

## 🛠️ Installation

### Step 1: Install Ollama

#### Windows
```powershell
# Download from https://ollama.ai/download/windows
# Or use winget
winget install Ollama.Ollama
```

#### macOS
```bash
# Download from https://ollama.ai/download/macos
# Or use Homebrew
brew install ollama
```

#### Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Step 2: Start Ollama Service

```powershell
# Start Ollama service
ollama serve
```

### Step 3: Pull AI Models

```powershell
# For fast responses (recommended)
ollama pull llama3.2:3b

# For better quality (requires more resources)
ollama pull llama3.2:7b

# For embeddings (if using advanced RAG)
ollama pull nomic-embed-text
```

### Step 4: Clone and Setup Project

```powershell
# Clone the repository
git clone <repository-url>
cd chat-bot

# Install dependencies
npm install

# Copy environment configuration
copy .env.example .env
```

### Step 5: Configure Environment

Edit `.env` file:

```env
# Server Configuration
PORT=3000
HOST=localhost
NODE_ENV=development

# Ollama Configuration
OLLAMA_MODEL=llama3.2:3b
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_TIMEOUT=120000

# RAG Configuration
RAG_DATA_PATH=./data
RAG_CHUNK_SIZE=1000
RAG_CHUNK_OVERLAP=200
RAG_TOP_K=4

# Company Information
COMPANY_NAME=ATG Solutions
COMPANY_DOMAIN=technology consulting

# Logging
LOG_LEVEL=info
```

## 🚀 Running the Application

### Development Mode

```powershell
# Start with auto-reload
npm run dev

# Or start normally
npm start
```

### Production Mode

```powershell
# Set production environment
$env:NODE_ENV="production"

# Start the application
npm start
```

### Using PM2 (Recommended for Production)

```powershell
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start server.js --name "ai-chatbot"

# Monitor
pm2 monit

# View logs
pm2 logs ai-chatbot
```

## 📁 Project Structure

```
chat-bot/
├── server.js                 # Application entry point
├── package.json              # Dependencies and scripts
├── .env                      # Environment configuration
├── index.html                # Frontend interface
├── data/                     # Company documents
│   ├── company_overview.txt
│   ├── products.txt
│   ├── services.txt
│   ├── policies.txt
│   ├── faqs.txt
│   ├── contacts.txt
│   └── courses.txt
└── src/                      # Source code
    ├── app.js                # Main application
    ├── config/
    │   └── index.js          # Configuration management
    ├── services/
    │   ├── chatService.js    # Chat orchestration
    │   ├── ollamaService.js  # AI model service
    │   └── ragService.js     # RAG implementation
    ├── utils/
    │   ├── logger.js         # Logging utility
    │   ├── errors.js         # Custom error classes
    │   ├── validator.js      # Input validation
    │   └── languageUtils.js  # Language processing
    ├── middleware/
    │   └── index.js          # Express middleware
    └── routes/
        └── api.js            # API routes
```

## 🔧 API Documentation

### Base URL
```
http://localhost:3000
```

### Endpoints

#### 1. Chat Message
**POST** `/api/chat`

Send a message to the chatbot.

**Request:**
```json
{
  "message": "What are your courses?"
}
```

**Response:**
```json
{
  "response": "Our courses include Full-Stack Web Development...",
  "hasContext": true,
  "language": "en",
  "sources": ["courses.txt"],
  "chunkCount": 2,
  "responseTime": "1250ms",
  "model": "llama3.2:3b",
  "tokens": 150,
  "timestamp": "2025-09-28T10:30:00.000Z"
}
```

#### 2. Health Check
**GET** `/api/health`

Check system health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-28T10:30:00.000Z",
  "services": {
    "ollama": {
      "status": "healthy",
      "connected": true,
      "model": "llama3.2:3b",
      "modelAvailable": true
    },
    "rag": {
      "status": "initialized",
      "documentsLoaded": 7,
      "chunksCreated": 18
    }
  }
}
```

#### 3. System Status
**GET** `/api/status`

Simple status check for load balancers.

**Response:**
```json
{
  "status": "operational",
  "service": "AI Chatbot",
  "version": "1.0.0",
  "uptime": 3600,
  "timestamp": "2025-09-28T10:30:00.000Z"
}
```

#### 4. Refresh System
**POST** `/api/refresh`

Refresh the RAG system (reload documents).

**Response:**
```json
{
  "message": "System refreshed successfully",
  "timestamp": "2025-09-28T10:30:00.000Z"
}
```

### Rate Limiting

- **Chat endpoint**: 20 requests per minute per IP
- **Other endpoints**: No rate limiting

### Error Responses

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Message is required",
    "field": "message",
    "timestamp": "2025-09-28T10:30:00.000Z"
  }
}
```

## 🌍 Multilingual Support

### Supported Languages
- **English**: Default language
- **Arabic**: Egyptian dialect with cultural context

### Arabic Features
- Automatic language detection
- Keyword expansion (Arabic → English for search)
- Egyptian dialect responses
- Cultural context and expressions

### Example Arabic Interactions
```
User: "ما هي أسعار الدورات التدريبية؟"
Bot: "أهلاً وسهلاً! دورات التدريب عندنا متنوعة..."

User: "عايز أعرف عن الخدمات"
Bot: "حضرتك تقدر تختار من خدماتنا المتنوعة..."
```

## 📊 Company Data Management

### Data Files Structure

Each `.txt` file in the `data/` directory represents a knowledge domain:

- **company_overview.txt**: Company information, mission, vision
- **products.txt**: Software products and solutions
- **services.txt**: Consulting and professional services
- **policies.txt**: Terms, conditions, and policies
- **faqs.txt**: Frequently asked questions
- **contacts.txt**: Contact information and locations
- **courses.txt**: Training programs and pricing

### Adding New Data

1. Create new `.txt` file in `data/` directory
2. Add relevant content (plain text format)
3. Restart the application or use `/api/refresh` endpoint

### Content Guidelines

- Use clear, structured text
- Include relevant keywords
- Add pricing and contact information
- Use both English and Arabic terms when applicable

## 🔍 Monitoring and Logging

### Log Levels
- **error**: Critical errors requiring attention
- **warn**: Warning conditions
- **info**: General information (default)
- **debug**: Detailed debugging information

### Log Format
```
🔄 [2025-09-28T10:30:00.000Z] INFO: User message processed
{
  "messageLength": 25,
  "hasContext": true,
  "responseTime": "1250ms"
}
```

### Monitoring Endpoints
- **Health**: `/api/health` - Detailed system status
- **Status**: `/api/status` - Simple uptime check
- **Ping**: `/ping` - Ultra-fast health check

## 🛡️ Security Features

### Implemented Security
- **Input validation**: Prevents malicious input
- **Rate limiting**: Protects against abuse
- **CORS configuration**: Controlled access
- **Security headers**: XSS and clickjacking protection
- **Error handling**: Prevents information leakage

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## 🚀 Deployment

### Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```powershell
docker build -t ai-chatbot .
docker run -p 3000:3000 ai-chatbot
```

### Cloud Deployment

#### Environment Variables
```env
NODE_ENV=production
PORT=3000
OLLAMA_BASE_URL=http://ollama-server:11434
LOG_LEVEL=warn
```

#### Health Check Configuration
- **Path**: `/api/health`
- **Timeout**: 30 seconds
- **Interval**: 60 seconds

### Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Ollama Connection Error
```
Error: Cannot connect to Ollama server
```
**Solution:**
```powershell
# Check if Ollama is running
ollama list

# Start Ollama service
ollama serve

# Check port availability
netstat -an | findstr :11434
```

#### 2. Model Not Found
```
Error: Model 'llama3.2:3b' not found
```
**Solution:**
```powershell
# Pull the required model
ollama pull llama3.2:3b

# List available models
ollama list
```

#### 3. Port Already in Use
```
Error: Port 3000 is already in use
```
**Solution:**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID)
taskkill /PID <PID> /F

# Or use different port
$env:PORT=3001
npm start
```

#### 4. Data Directory Not Found
```
Error: Data directory not found: ./data
```
**Solution:**
```powershell
# Create data directory
mkdir data

# Add sample files
echo "Company Overview" > data/company_overview.txt
```

### Performance Optimization

#### 1. Model Selection
- **llama3.2:3b**: Fast responses, good quality
- **llama3.2:7b**: Better quality, slower responses
- **llama3.2:1b**: Fastest, lower quality

#### 2. Chunk Size Tuning
```env
# Smaller chunks = faster search, less context
RAG_CHUNK_SIZE=500

# Larger chunks = more context, slower search
RAG_CHUNK_SIZE=2000
```

#### 3. Memory Management
```powershell
# Increase Node.js memory limit
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm start
```

## 📈 Performance Metrics

### Typical Response Times
- **Simple queries**: 500-1500ms
- **Complex queries**: 1500-3000ms
- **Arabic queries**: 1000-2000ms

### Resource Usage
- **RAM**: 2-4GB (depending on model)
- **CPU**: 20-60% during generation
- **Disk**: 50MB application + model size

## 🧪 Testing

### Manual Testing
```powershell
# Test English query
curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{"message":"What services do you offer?"}'

# Test Arabic query
curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{"message":"ما هي الخدمات المتاحة؟"}'

# Test health endpoint
curl http://localhost:3000/api/health
```

### Load Testing
```powershell
# Install artillery
npm install -g artillery

# Create test config
echo 'config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 5
scenarios:
  - name: "Chat test"
    requests:
      - post:
          url: "/api/chat"
          json:
            message: "Hello"' > load-test.yml

# Run load test
artillery run load-test.yml
```

## 📞 Support

### Getting Help
1. Check this documentation
2. Review error logs
3. Verify Ollama status
4. Check GitHub issues

### Contributing
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

### Planned Features
- [ ] Vector database integration (ChromaDB/Pinecone)
- [ ] Advanced conversation memory
- [ ] Multi-turn conversations
- [ ] Document upload interface
- [ ] Analytics dashboard
- [ ] WebSocket real-time chat
- [ ] Voice input/output
- [ ] Mobile app

### Version History
- **v1.0.0**: Initial release with RAG and multilingual support
- **v0.9.0**: Beta release with basic functionality
- **v0.8.0**: Alpha release with proof of concept

---

*Built with ❤️ for intelligent customer service*
