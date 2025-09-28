/**
 * Input validation utilities
 */

const { ValidationError } = require('./errors');

class Validator {
  /**
   * Validate chat message input
   * @param {Object} input - Input object to validate
   * @returns {Object} Validated and sanitized input
   */
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

  /**
   * Sanitize text input
   * @param {string} text - Text to sanitize
   * @returns {string} Sanitized text
   */
  static sanitizeText(text) {
    if (typeof text !== 'string') return '';
    
    return text
      .trim()
      // Remove potentially harmful HTML/JS
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>?/gm, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ');
  }

  /**
   * Validate configuration object
   * @param {Object} config - Configuration to validate
   * @throws {ValidationError} If validation fails
   */
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

  /**
   * Get nested object value by path
   * @param {Object} obj - Object to search
   * @param {string} path - Dot-notation path
   * @returns {*} Value at path
   */
  static getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

module.exports = Validator;
