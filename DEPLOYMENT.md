# AI Chatbot - Deployment Guide

## 🚀 Deployment Options

### 1. Local Development Deployment

#### Prerequisites
- Node.js 18+ installed
- Ollama installed and running
- Git for version control

#### Steps
```powershell
# Clone the repository
git clone <your-repo-url>
cd chat-bot

# Install dependencies
npm install

# Copy environment file
copy .env.example .env

# Start Ollama service
ollama serve

# Pull required models
ollama pull llama3.2:3b

# Start the application
npm start
```

### 2. Production Server Deployment

#### Using PM2 (Process Manager)

```powershell
# Install PM2 globally
npm install -g pm2

# Start application with PM2
pm2 start server.js --name "ai-chatbot" --instances 2

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup

# Monitor application
pm2 monit
```

#### PM2 Configuration File (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'ai-chatbot',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      LOG_LEVEL: 'warn'
    },
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

### 3. Docker Deployment

#### Dockerfile
```dockerfile
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache curl

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start application
CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    volumes:
      - ollama_data:/root/.ollama
    ports:
      - "11434:11434"
    environment:
      - OLLAMA_ORIGINS=*
    restart: unless-stopped

  ai-chatbot:
    build: .
    container_name: ai-chatbot
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - OLLAMA_BASE_URL=http://ollama:11434
    depends_on:
      - ollama
    restart: unless-stopped
    volumes:
      - ./data:/app/data:ro
      - ./logs:/app/logs

volumes:
  ollama_data:
```

#### Deploy with Docker
```powershell
# Build and start services
docker-compose up -d

# Pull models (run once after first start)
docker exec ollama ollama pull llama3.2:3b

# View logs
docker-compose logs -f ai-chatbot

# Scale the service
docker-compose up -d --scale ai-chatbot=3
```

### 4. Cloud Deployment (AWS)

#### AWS EC2 Deployment

**Launch EC2 Instance:**
- Instance Type: t3.large or larger (for AI models)
- AMI: Amazon Linux 2
- Security Groups: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)

**Setup Script:**
```bash
#!/bin/bash
# Update system
sudo yum update -y

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install Docker
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Clone and setup application
git clone <your-repo-url> /home/ec2-user/chat-bot
cd /home/ec2-user/chat-bot
npm install
cp .env.example .env

# Start services
sudo systemctl enable docker
ollama serve &
npm start
```

#### AWS ECS Deployment

**Task Definition (task-definition.json):**
```json
{
  "family": "ai-chatbot",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "4096",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "ollama",
      "image": "ollama/ollama:latest",
      "portMappings": [
        {
          "containerPort": 11434,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/ai-chatbot",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ollama"
        }
      }
    },
    {
      "name": "chatbot",
      "image": "your-account.dkr.ecr.us-west-2.amazonaws.com/ai-chatbot:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "OLLAMA_BASE_URL",
          "value": "http://localhost:11434"
        }
      ],
      "dependsOn": [
        {
          "containerName": "ollama",
          "condition": "START"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/ai-chatbot",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "chatbot"
        }
      }
    }
  ]
}
```

### 5. Kubernetes Deployment

#### Deployment YAML
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-chatbot
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-chatbot
  template:
    metadata:
      labels:
        app: ai-chatbot
    spec:
      containers:
      - name: ollama
        image: ollama/ollama:latest
        ports:
        - containerPort: 11434
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
      - name: chatbot
        image: your-registry/ai-chatbot:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: OLLAMA_BASE_URL
          value: "http://localhost:11434"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/status
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: ai-chatbot-service
spec:
  selector:
    app: ai-chatbot
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### 6. Reverse Proxy Setup

#### Nginx Configuration
```nginx
upstream ai_chatbot {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Gzip compression
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;

    location / {
        proxy_pass http://ai_chatbot;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint (bypass proxy for direct monitoring)
    location /health {
        access_log off;
        proxy_pass http://ai_chatbot;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://ai_chatbot;
    }
}
```

### 7. Monitoring and Logging

#### Log Aggregation with ELK Stack

**Docker Compose Addition:**
```yaml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:7.14.0
  environment:
    - discovery.type=single-node
  ports:
    - "9200:9200"

kibana:
  image: docker.elastic.co/kibana/kibana:7.14.0
  ports:
    - "5601:5601"
  depends_on:
    - elasticsearch

logstash:
  image: docker.elastic.co/logstash/logstash:7.14.0
  volumes:
    - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
  depends_on:
    - elasticsearch
```

#### Application Monitoring

**New Relic Setup:**
```javascript
// Add to server.js
require('newrelic');

// Environment variables
NEW_RELIC_LICENSE_KEY=your_license_key
NEW_RELIC_APP_NAME=AI Chatbot
```

**Prometheus Metrics:**
```javascript
// Add metrics endpoint
const promClient = require('prom-client');

// Create metrics
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

// Export metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(promClient.register.metrics());
});
```

### 8. CI/CD Pipeline

#### GitHub Actions
```yaml
name: Deploy AI Chatbot

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Build Docker image
      run: docker build -t ai-chatbot .
      
    - name: Deploy to production
      run: |
        docker tag ai-chatbot ${{ secrets.DOCKER_REGISTRY }}/ai-chatbot:latest
        docker push ${{ secrets.DOCKER_REGISTRY }}/ai-chatbot:latest
```

### 9. Environment-Specific Configurations

#### Production Environment Variables
```env
NODE_ENV=production
PORT=3000
LOG_LEVEL=warn
OLLAMA_BASE_URL=http://ollama:11434
RAG_CHUNK_SIZE=1000
CORS_ORIGIN=https://your-domain.com
```

#### Development Environment
```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
OLLAMA_BASE_URL=http://localhost:11434
RAG_CHUNK_SIZE=500
CORS_ORIGIN=*
```

### 10. Performance Optimization for Production

#### Memory Management
```javascript
// Increase Node.js memory limit
process.env.NODE_OPTIONS = '--max-old-space-size=2048';
```

#### Connection Pooling
```javascript
// Add HTTP keep-alive
const http = require('http');
http.globalAgent.keepAlive = true;
http.globalAgent.keepAliveMsecs = 1000;
http.globalAgent.maxSockets = 50;
```

#### Caching Strategy
```javascript
// Add Redis caching
const redis = require('redis');
const client = redis.createClient();

// Cache frequently requested responses
app.use('/api/chat', async (req, res, next) => {
  const cacheKey = `chat:${Buffer.from(req.body.message).toString('base64')}`;
  const cached = await client.get(cacheKey);
  
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  next();
});
```

This deployment guide covers various scenarios from local development to enterprise-scale cloud deployments. Choose the approach that best fits your infrastructure and requirements.
