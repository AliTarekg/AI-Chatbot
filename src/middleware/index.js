const logger = require('../utils/logger');
const { ValidationError, AppError } = require('../utils/errors');

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const { method, url, ip } = req;
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;
    
    if (statusCode >= 400 || duration > 1000) {
      const logLevel = statusCode >= 400 ? 'warn' : 'info';
      logger[logLevel]('Request completed', {
        method,
        url,
        statusCode,
        duration: `${duration}ms`
      });
    }
  });

  next();
};

const errorHandler = (error, req, res, next) => {
  logger.error('Request error', {
    error: error.message,
    type: error.constructor.name,
    stack: error.stack,
    url: req.url,
    method: req.method
  });

  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An internal server error occurred';

  if (error instanceof ValidationError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
  } else if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
  }

  const response = {
    error: {
      code,
      message,
      timestamp: new Date().toISOString()
    }
  };

  if (error instanceof ValidationError && error.field) {
    response.error.field = error.field;
  }

  if (process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

const createRateLimiter = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
  const requests = new Map();

  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (requests.has(clientId)) {
      const clientRequests = requests.get(clientId).filter(time => time > windowStart);
      requests.set(clientId, clientRequests);
    } else {
      requests.set(clientId, []);
    }

    const clientRequests = requests.get(clientId);

    if (clientRequests.length >= maxRequests) {
      logger.warn('Rate limit exceeded', { 
        clientId, 
        requests: clientRequests.length,
        windowMs,
        maxRequests
      });

      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
          retryAfter: Math.ceil(windowMs / 1000)
        }
      });
    }

    clientRequests.push(now);
    next();
  };
};

const corsHandler = (req, res, next) => {
  const { config } = require('../config');
  
  res.header('Access-Control-Allow-Origin', config.server.cors.origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', config.server.cors.credentials);

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};

const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};

const healthCheck = (req, res, next) => {
  if (req.path === '/ping') {
    return res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString() 
    });
  }
  next();
};

module.exports = {
  requestLogger,
  errorHandler,
  createRateLimiter,
  corsHandler,
  securityHeaders,
  healthCheck
};
