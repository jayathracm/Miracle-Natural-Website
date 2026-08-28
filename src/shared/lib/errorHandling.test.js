import { describe, it, expect } from 'vitest';
import { AppError, ERROR_CODES, getUserFriendlyMessage } from './errorHandling';

describe('AppError', () => {
  it('defaults to UNKNOWN_ERROR when no code is given', () => {
    const error = new AppError('Something broke');
    expect(error.code).toBe('UNKNOWN_ERROR');
    expect(error.message).toBe('Something broke');
    expect(error.name).toBe('AppError');
  });

  it('carries a custom code and details', () => {
    const error = new AppError('Bad input', ERROR_CODES.VALIDATION_ERROR, { field: 'email' });
    expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(error.details).toEqual({ field: 'email' });
  });

  it('is a real Error instance (works with try/catch, instanceof Error)', () => {
    const error = new AppError('x');
    expect(error instanceof Error).toBe(true);
  });
});

describe('getUserFriendlyMessage', () => {
  it('returns a specific message for each known error code', () => {
    expect(getUserFriendlyMessage(new AppError('x', ERROR_CODES.NETWORK_ERROR))).toMatch(/internet connection/i);
    expect(getUserFriendlyMessage(new AppError('x', ERROR_CODES.VALIDATION_ERROR))).toMatch(/check your input/i);
    expect(getUserFriendlyMessage(new AppError('x', ERROR_CODES.AUTHENTICATION_ERROR))).toMatch(/log in/i);
    expect(getUserFriendlyMessage(new AppError('x', ERROR_CODES.AUTHORIZATION_ERROR))).toMatch(/permission/i);
    expect(getUserFriendlyMessage(new AppError('x', ERROR_CODES.NOT_FOUND))).toMatch(/not found/i);
    expect(getUserFriendlyMessage(new AppError('x', ERROR_CODES.SERVER_ERROR))).toMatch(/our end/i);
  });

  it('returns a generic message for an AppError with an unrecognized code', () => {
    expect(getUserFriendlyMessage(new AppError('x', 'SOME_FUTURE_CODE'))).toBe(
      'An unexpected error occurred. Please try again.'
    );
  });

  it('returns the same generic message for a plain (non-AppError) Error, rather than leaking internals', () => {
    const rawError = new TypeError('Cannot read properties of undefined');
    expect(getUserFriendlyMessage(rawError)).toBe('An unexpected error occurred. Please try again.');
  });

  it('handles a non-Error value gracefully (e.g. a rejected promise with a string reason)', () => {
    expect(getUserFriendlyMessage('just a string')).toBe('An unexpected error occurred. Please try again.');
    expect(getUserFriendlyMessage(null)).toBe('An unexpected error occurred. Please try again.');
    expect(getUserFriendlyMessage(undefined)).toBe('An unexpected error occurred. Please try again.');
  });

  it('every ERROR_CODES entry produces a distinct message from the generic fallback', () => {
    const generic = 'An unexpected error occurred. Please try again.';
    Object.values(ERROR_CODES).forEach((code) => {
      if (code === ERROR_CODES.UNKNOWN_ERROR) return; // UNKNOWN_ERROR intentionally falls through to the generic message
      const message = getUserFriendlyMessage(new AppError('x', code));
      expect(message).not.toBe(generic);
    });
  });
});
