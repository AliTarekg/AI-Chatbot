const { ValidationError } = require('./errors');

class Validator {
  static validateChatInput(input) {
    if (!input || typeof input !== 'object') {
      throw new ValidationError('Request body must be a valid object');
    }

    const { message } = input;

    if (!message) {
      throw new ValidationError('Message is required', 'message');
    }

    if (typeof message !== 'string') {
      throw new ValidationError('Message must be a string', 'message');
    }

    if (message.trim().length === 0) {
      throw new ValidationError('Message cannot be empty', 'message');
    }

    if (message.length > 2000) {
      throw new ValidationError('Message too long (max 2000 characters)', 'message');
    }

    return {
      message: message.trim()
    };
  }

  static sanitizeText(text) {
    if (typeof text !== 'string') return '';
    
    return text
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>?/gm, '')
      .replace(/\s+/g, ' ');
  }

  static validateConfig(config) {
    const required = [
      'server.port',
      'ollama.baseUrl',
      'ollama.model'
    ];

    for (const path of required) {
      if (!this.getNestedValue(config, path)) {
        throw new ValidationError(`Missing required configuration: ${path}`);
      }
    }
  }

  static getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

module.exports = Validator;
