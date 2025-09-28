/**
 * Application entry point
 * Starts the AI Chatbot server
 */

const Application = require('./src/app');
const logger = require('./src/utils/logger');

async function main() {
  try {
    const app = new Application();
    await app.start();
  } catch (error) {
    logger.error('Application startup failed', { 
      error: error.message,
      stack: error.stack 
    });
    process.exit(1);
  }
}

// Start the application
main();
