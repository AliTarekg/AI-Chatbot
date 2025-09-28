# API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
No authentication required for current version.

## Rate Limiting
- Chat endpoint: 20 requests per minute per IP
- Other endpoints: No rate limiting

## Response Format
All API responses follow this structure:

### Success Response
```json
{
  "response": "Generated response text",
  "hasContext": true,
  "language": "en",
  "sources": ["file1.txt", "file2.txt"],
  "responseTime": "1250ms",
  "timestamp": "2025-09-28T10:30:00.000Z"
}
```

### Error Response
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "field": "fieldName",
    "timestamp": "2025-09-28T10:30:00.000Z"
  }
}
```

## Endpoints

### 1. Chat Message
Send a message to the AI chatbot.

**Endpoint:** `POST /api/chat`

**Request Body:**
```json
{
  "message": "Your question here"
}
```

**Parameters:**
- `message` (string, required): The user's message or question. Maximum 2000 characters.

**Response:**
```json
{
  "response": "Based on our company information, we offer several courses including Full-Stack Web Development Bootcamp...",
  "hasContext": true,
  "language": "en",
  "sources": ["courses.txt", "services.txt"],
  "chunkCount": 3,
  "responseTime": "1250ms",
  "model": "llama3.2:3b",
  "tokens": 150,
  "timestamp": "2025-09-28T10:30:00.000Z"
}
```

**Response Fields:**
- `response` (string): The AI-generated response
- `hasContext` (boolean): Whether relevant company context was found
- `language` (string): Detected language ('en' or 'ar')
- `sources` (array): List of source files used for context
- `chunkCount` (number): Number of document chunks used
- `responseTime` (string): Time taken to generate response
- `model` (string): AI model used
- `tokens` (number): Number of tokens generated
- `timestamp` (string): ISO timestamp of response

**Error Responses:**
- `400 Bad Request`: Invalid input
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Processing error

**Examples:**

English Query:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What courses do you offer?"}'
```

Arabic Query:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "ما هي أسعار الدورات التدريبية؟"}'
```

### 2. Health Check
Get detailed system health status.

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-28T10:30:00.000Z",
  "services": {
    "ollama": {
      "status": "healthy",
      "connected": true,
      "baseUrl": "http://localhost:11434",
      "model": "llama3.2:3b",
      "modelAvailable": true,
      "modelsCount": 5
    },
    "rag": {
      "status": "initialized",
      "isInitialized": true,
      "documentsLoaded": 7,
      "chunksCreated": 18,
      "documentsInMemory": 18,
      "lastUpdate": "2025-09-28T10:25:00.000Z",
      "dataPath": "./data"
    }
  }
}
```

**Status Values:**
- `healthy`: All services operational
- `degraded`: Some services have issues
- `error`: Critical system error

**Example:**
```bash
curl http://localhost:3000/api/health
```

### 3. System Status
Simple status check for load balancers.

**Endpoint:** `GET /api/status`

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

**Example:**
```bash
curl http://localhost:3000/api/status
```

### 4. Refresh System
Refresh the RAG system (reload documents).

**Endpoint:** `POST /api/refresh`

**Response:**
```json
{
  "message": "System refreshed successfully",
  "timestamp": "2025-09-28T10:30:00.000Z"
}
```

**Use Case:** Call this endpoint after updating documents in the data directory.

**Example:**
```bash
curl -X POST http://localhost:3000/api/refresh
```

### 5. Quick Health Check
Ultra-fast health check for monitoring.

**Endpoint:** `GET /ping`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-09-28T10:30:00.000Z"
}
```

**Example:**
```bash
curl http://localhost:3000/ping
```

## Legacy Endpoints (Backward Compatibility)

### Legacy Chat
**Endpoint:** `POST /chat`
Same as `/api/chat` but without the `/api` prefix.

### Legacy Health
**Endpoint:** `GET /health`
Same as `/api/health` but without the `/api` prefix.

## Error Codes

### Client Errors (4xx)
- `VALIDATION_ERROR` (400): Invalid input data
- `NOT_FOUND` (404): Endpoint not found
- `RATE_LIMIT_EXCEEDED` (429): Too many requests

### Server Errors (5xx)
- `INTERNAL_ERROR` (500): General server error
- `OLLAMA_ERROR` (502): AI service unavailable
- `RAG_ERROR` (500): Document processing error
- `CONFIG_ERROR` (500): Configuration error
- `CHAT_PROCESSING_ERROR` (500): Chat processing failed

## Response Times

### Typical Performance
- Simple queries: 500-1500ms
- Complex queries: 1500-3000ms
- Arabic queries: 1000-2000ms
- Health checks: <100ms

### Factors Affecting Response Time
- Query complexity
- Available context
- AI model size
- System resources

## Language Support

### Supported Languages
- **English**: Full support
- **Arabic**: Egyptian dialect with cultural context

### Language Detection
The system automatically detects the input language and responds accordingly:

- Arabic text triggers Egyptian dialect responses
- English text triggers standard professional responses
- Mixed language queries default to English

### Arabic Features
- Automatic keyword expansion (Arabic → English for search)
- Egyptian dialect responses with cultural expressions
- Proper handling of Arabic text normalization

## Data Sources

### Available Document Types
- `company_overview.txt`: Company information
- `products.txt`: Product catalog
- `services.txt`: Service offerings
- `policies.txt`: Terms and policies
- `faqs.txt`: Frequently asked questions
- `contacts.txt`: Contact information
- `courses.txt`: Training courses and pricing

### Context Retrieval
The system uses RAG (Retrieval-Augmented Generation) to find relevant context:

1. Query analysis and keyword extraction
2. Semantic search through document chunks
3. Context ranking and selection
4. Prompt enhancement with relevant information

## Best Practices

### Query Optimization
- Be specific in your questions
- Use keywords relevant to your domain
- Ask one question at a time for best results

### Error Handling
Always check the response status code:
```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Your question' })
});

if (!response.ok) {
  const error = await response.json();
  console.error('API Error:', error);
  return;
}

const data = await response.json();
```

### Rate Limiting
Implement client-side rate limiting to avoid 429 errors:
```javascript
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function sendMessage(message) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    
    if (response.status === 429) {
      await delay(60000); // Wait 1 minute
      return sendMessage(message); // Retry
    }
    
    return await response.json();
  } catch (error) {
    console.error('Request failed:', error);
  }
}
```

## Integration Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

async function chatWithBot(message) {
  try {
    const response = await axios.post('http://localhost:3000/api/chat', {
      message: message
    });
    
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('API Error:', error.response.data);
    } else {
      console.error('Network Error:', error.message);
    }
  }
}

// Usage
chatWithBot('What services do you offer?')
  .then(response => console.log(response.response))
  .catch(console.error);
```

### Python
```python
import requests
import json

def chat_with_bot(message):
    url = 'http://localhost:3000/api/chat'
    payload = {'message': message}
    headers = {'Content-Type': 'application/json'}
    
    try:
        response = requests.post(url, data=json.dumps(payload), headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        return None

# Usage
result = chat_with_bot('What courses do you offer?')
if result:
    print(result['response'])
```

### PHP
```php
<?php
function chatWithBot($message) {
    $url = 'http://localhost:3000/api/chat';
    $data = json_encode(['message' => $message]);
    
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/json',
            'content' => $data
        ]
    ]);
    
    $response = file_get_contents($url, false, $context);
    return json_decode($response, true);
}

// Usage
$result = chatWithBot('What are your services?');
echo $result['response'];
?>
```

### Frontend JavaScript
```html
<!DOCTYPE html>
<html>
<head>
    <title>Chat Integration</title>
</head>
<body>
    <div id="chat"></div>
    <input type="text" id="messageInput" placeholder="Type your message...">
    <button onclick="sendMessage()">Send</button>

    <script>
        async function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value;
            
            if (!message.trim()) return;
            
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ message })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    displayMessage('User', message);
                    displayMessage('Bot', data.response);
                    input.value = '';
                } else {
                    displayMessage('Error', data.error.message);
                }
            } catch (error) {
                displayMessage('Error', 'Network error occurred');
            }
        }
        
        function displayMessage(sender, message) {
            const chat = document.getElementById('chat');
            const div = document.createElement('div');
            div.innerHTML = `<strong>${sender}:</strong> ${message}`;
            chat.appendChild(div);
        }
        
        // Send message on Enter key
        document.getElementById('messageInput')
            .addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
    </script>
</body>
</html>
```

## Monitoring and Analytics

### Health Monitoring
Set up automated health checks:
```bash
# Check every 5 minutes
*/5 * * * * curl -f http://localhost:3000/api/health || echo "Service down"
```

### Performance Monitoring
Track response times and error rates:
```javascript
const startTime = Date.now();
const response = await fetch('/api/chat', options);
const responseTime = Date.now() - startTime;

console.log(`Response time: ${responseTime}ms`);
```

### Usage Analytics
Monitor API usage patterns:
- Track popular queries
- Monitor response quality
- Analyze language preferences
- Monitor error rates by endpoint

This API documentation provides comprehensive information for integrating with the AI Chatbot system. For additional support or questions, refer to the main README.md file.
