// Error handling utilities for consistent error management across the application

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Error codes for different types of errors
 */
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

/**
 * Log error to console and optionally to external service
 * @param {Error} error - The error object
 * @param {Object} context - Additional context information
 */
export const logError = (error, context = {}) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    code: error.code || 'UNKNOWN_ERROR',
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    ...context,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', errorData);
  }

  // In production, you would send this to your error tracking service
  // Example: sendToErrorService(errorData);

  return errorData;
};

/**
 * Send error to external error tracking service
 * @param {Object} errorData - Error data to send
 */
export const sendToErrorService = async (errorData) => {
  try {
    // Example implementation for sending to your error tracking service
    // await fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorData)
    // });

    console.log('Error sent to tracking service:', errorData);
  } catch (loggingError) {
    console.error('Failed to send error to tracking service:', loggingError);
  }
};

/**
 * Handle async operations with error catching
 * @param {Function} asyncFn - The async function to execute
 * @param {Function} onError - Error handler function
 * @returns {Promise} - Promise that resolves with the result or rejects with error
 */
export const withErrorHandling = async (asyncFn, onError = null) => {
  try {
    return await asyncFn();
  } catch (error) {
    const errorData = logError(error);

    if (onError) {
      onError(error, errorData);
    }

    throw error;
  }
};

/**
 * Create a user-friendly error message
 * @param {Error} error - The error object
 * @returns {string} - User-friendly error message
 */
export const getUserFriendlyMessage = (error) => {
  if (error instanceof AppError) {
    switch (error.code) {
      case ERROR_CODES.NETWORK_ERROR:
        return 'Unable to connect to the server. Please check your internet connection and try again.';
      case ERROR_CODES.VALIDATION_ERROR:
        return 'Please check your input and try again.';
      case ERROR_CODES.AUTHENTICATION_ERROR:
        return 'Please log in to continue.';
      case ERROR_CODES.AUTHORIZATION_ERROR:
        return "You don't have permission to perform this action.";
      case ERROR_CODES.NOT_FOUND:
        return 'The requested resource was not found.';
      case ERROR_CODES.SERVER_ERROR:
        return 'Something went wrong on our end. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  return 'An unexpected error occurred. Please try again.';
};

/**
 * Check if the error is a network error
 * @param {Error} error - The error object
 * @returns {boolean} - True if it's a network error
 */
export const isNetworkError = (error) => {
  return (
    (error.name === 'TypeError' && error.message.includes('fetch')) ||
    error.code === ERROR_CODES.NETWORK_ERROR
  );
};

/**
 * Check if the error is a 404 error
 * @param {Error} error - The error object
 * @returns {boolean} - True if it's a 404 error
 */
export const isNotFoundError = (error) => {
  return error.status === 404 || error.code === ERROR_CODES.NOT_FOUND;
};

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} - Promise that resolves with the result
 */
export const retryWithBackoff = async (
  fn,
  maxRetries = 3,
  baseDelay = 1000
) => {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        throw error;
      }

      // Wait with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};
