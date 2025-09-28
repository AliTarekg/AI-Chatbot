# AI Chatbot - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+ ([Download](https://nodejs.org/))
- 8GB+ RAM (for AI models)

### Step 1: Install Ollama
Choose your platform:

**Windows:**
```powershell
# Download from https://ollama.ai/download/windows
winget install Ollama.Ollama
```

**macOS:**
```bash
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Step 2: Start Ollama & Pull Model
```powershell
# Start Ollama service
ollama serve

# In a new terminal, pull the AI model
ollama pull llama3.2:3b
```

### Step 3: Setup Project
```powershell
# Clone repository
git clone <your-repo-url>
cd chat-bot

# Install dependencies
npm install

# Setup environment
copy .env.example .env
```

### Step 4: Start Application
```powershell
# Start the chatbot
npm start

# Open browser
start http://localhost:3000
```

## ✅ Verify Installation

1. **Check Health:** Visit http://localhost:3000/api/health
2. **Test Chat:** Send a message in the web interface
3. **Test Arabic:** Try "ما هي خدماتكم؟"

## 🔧 Basic Configuration

Edit `.env` file for customization:

```env
# Change AI model (if you have others)
OLLAMA_MODEL=llama3.2:7b

# Change port
PORT=8080

# Enable debug logging
LOG_LEVEL=debug
```

## 📝 Adding Your Data

1. Edit files in `data/` directory:
   - `company_overview.txt` - Your company info
   - `services.txt` - Your services
   - `products.txt` - Your products
   - `courses.txt` - Your courses/training

2. Restart application or call refresh:
   ```powershell
   curl -X POST http://localhost:3000/api/refresh
   ```

## 🌍 Multi-Language Support

The system automatically detects and responds in:
- **English** - Professional tone
- **Arabic** - Egyptian dialect with cultural context

## 🆘 Troubleshooting

**Ollama Not Found:**
```powershell
# Check if Ollama is running
ollama list

# Start if not running
ollama serve
```

**Port Already in Use:**
```powershell
# Change port in .env
echo "PORT=3001" >> .env
```

**Model Missing:**
```powershell
# Pull required model
ollama pull llama3.2:3b
```

## 🔗 Next Steps

- [📖 Full Documentation](README.md)
- [🚀 Deployment Guide](DEPLOYMENT.md)
- [📡 API Reference](API.md)
- [🧪 Run Tests](test/integration.js)

## 💬 Example Usage

### Web Interface
1. Open http://localhost:3000
2. Type: "What services do you offer?"
3. Get AI response with company context

### API Usage
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Tell me about your courses"}'
```

## 🎯 Key Features

- ✅ **Local AI** - Runs completely offline
- ✅ **Multilingual** - English & Arabic support
- ✅ **Smart Search** - RAG with company documents
- ✅ **Modern UI** - Responsive web interface
- ✅ **Production Ready** - Error handling & logging
- ✅ **Easy Deploy** - Docker, PM2, Cloud ready

---

🎉 **You're all set!** Your AI chatbot is now running with your company data.
