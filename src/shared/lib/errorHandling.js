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
  if (import.meta.env.DEV) {
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
