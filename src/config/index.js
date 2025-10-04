require('dotenv').config();

const config = {
  server: {
    port: parseInt(process.env.PORT) || 3000,
    host: process.env.HOST || 'localhost',
    environment: process.env.NODE_ENV || 'development',
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true
    }
  },  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.2:3b',
    embedModel: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text',
    timeout: parseInt(process.env.OLLAMA_TIMEOUT) || 25000,
    options: {
      temperature: parseFloat(process.env.OLLAMA_TEMPERATURE) || 0.1,
      top_p: parseFloat(process.env.OLLAMA_TOP_P) || 0.3,
      top_k: parseInt(process.env.OLLAMA_TOP_K) || 3,
      num_predict: parseInt(process.env.OLLAMA_NUM_PREDICT) || 100,
      num_ctx: parseInt(process.env.OLLAMA_NUM_CTX) || 512,
      repeat_penalty: parseFloat(process.env.OLLAMA_REPEAT_PENALTY) || 1.1,
      num_thread: parseInt(process.env.OLLAMA_NUM_THREAD) || -1,
      mirostat: 0,
      tfs_z: 1.0,
      seed: -1
    }
  },  rag: {
    dataPath: process.env.RAG_DATA_PATH || './data',
    chunkSize: parseInt(process.env.RAG_CHUNK_SIZE) || 800,
    chunkOverlap: parseInt(process.env.RAG_CHUNK_OVERLAP) || 150,
    topK: parseInt(process.env.RAG_TOP_K) || 5,
    minScore: parseFloat(process.env.RAG_MIN_SCORE) || 0.5
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined'
  },
  company: {
    name: process.env.COMPANY_NAME || 'ATG Solutions',
    domain: process.env.COMPANY_DOMAIN || 'technology consulting'
  }
};

function validateConfig() {
  const required = [
    'server.port',
    'ollama.baseUrl',
    'ollama.model'
  ];

  for (const path of required) {
    const keys = path.split('.');
    let value = config;
    
    for (const key of keys) {
      value = value?.[key];
    }
    
    if (value === undefined || value === null) {
      throw new Error(`Missing required configuration: ${path}`);
    }
  }
}

module.exports = {
  config,
  validateConfig
};
