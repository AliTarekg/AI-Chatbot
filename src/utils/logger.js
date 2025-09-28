/**
 * Logging utility with different log levels and formatting
 */

const { config } = require('../config');

class Logger {
  constructor() {
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    this.colors = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m',  // Yellow
      info: '\x1b[36m',  // Cyan
      debug: '\x1b[37m', // White
      reset: '\x1b[0m'
    };
    
    this.icons = {
      error: '❌',
      warn: '⚠️',
      info: '🔄',
      debug: '🐛'
    };
  }

  /**
   * Check if log level should be output
   * @param {string} level - Log level to check
   * @returns {boolean} True if should log
   */
  shouldLog(level) {
    const currentLevel = this.levels[config.logging.level] || 2;
    const messageLevel = this.levels[level] || 0;
    return messageLevel <= currentLevel;
  }

  /**
   * Format log message
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   * @returns {string} Formatted message
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const icon = this.icons[level] || '';
    const color = this.colors[level] || '';
    const reset = this.colors.reset;
    
    let formattedMessage = `${color}${icon} [${timestamp}] ${level.toUpperCase()}: ${message}${reset}`;
    
    if (Object.keys(meta).length > 0) {
      formattedMessage += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return formattedMessage;
  }

  /**
   * Log error message
   * @param {string} message - Error message
   * @param {Object} meta - Additional metadata
   */
  error(message, meta = {}) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, meta));
    }
  }

  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {Object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  /**
   * Log info message
   * @param {string} message - Info message
   * @param {Object} meta - Additional metadata
   */
  info(message, meta = {}) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, meta));
    }
  }

  /**
   * Log debug message
   * @param {string} message - Debug message
   * @param {Object} meta - Additional metadata
   */
  debug(message, meta = {}) {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, meta));
    }
  }

  /**
   * Log with custom level
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  log(level, message, meta = {}) {
    if (this.shouldLog(level)) {
      console.log(this.formatMessage(level, message, meta));
    }
  }
}

// Export singleton instance
module.exports = new Logger();
