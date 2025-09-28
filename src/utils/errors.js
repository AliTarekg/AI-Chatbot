/**
 * Custom error classes for better error handling
 */

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
  }
}

class OllamaError extends AppError {
  constructor(message, originalError = null) {
    super(message, 502, 'OLLAMA_ERROR');
    this.originalError = originalError;
  }
}

class RAGError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500, 'RAG_ERROR');
    this.originalError = originalError;
  }
}

class ConfigError extends AppError {
  constructor(message) {
    super(message, 500, 'CONFIG_ERROR');
  }
}

module.exports = {
  AppError,
  ValidationError,
  OllamaError,
  RAGError,
  ConfigError
};
