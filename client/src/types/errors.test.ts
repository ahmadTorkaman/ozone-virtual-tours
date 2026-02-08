import { describe, it, expect } from 'vitest';
import {
  parseTauriError,
  isTauriErrorJson,
  getErrorMessage,
  isErrorCode,
  isRecoverableError,
  type TauriError,
} from './errors';

describe('Error Utilities', () => {
  describe('parseTauriError', () => {
    it('should parse valid JSON error string', () => {
      const errorJson = JSON.stringify({
        code: 'VALIDATION_ERROR',
        message: 'Name is required',
      });

      const result = parseTauriError(errorJson);

      expect(result.code).toBe('VALIDATION_ERROR');
      expect(result.message).toBe('Name is required');
    });

    it('should parse error with details', () => {
      const errorJson = JSON.stringify({
        code: 'VALIDATION_ERROR',
        message: 'Invalid field',
        details: 'name',
      });

      const result = parseTauriError(errorJson);

      expect(result.code).toBe('VALIDATION_ERROR');
      expect(result.details).toBe('name');
    });

    it('should handle plain string error (legacy format)', () => {
      const result = parseTauriError('Something went wrong');

      expect(result.code).toBe('INTERNAL_ERROR');
      expect(result.message).toBe('Something went wrong');
    });

    it('should handle Error objects', () => {
      const error = new Error('Test error');
      const result = parseTauriError(error);

      expect(result.code).toBe('INTERNAL_ERROR');
      expect(result.message).toBe('Test error');
    });

    it('should handle non-string/non-Error values', () => {
      const result = parseTauriError(42);

      expect(result.code).toBe('INTERNAL_ERROR');
      expect(result.message).toBe('42');
    });
  });

  describe('isTauriErrorJson', () => {
    it('should return true for valid error JSON', () => {
      const errorJson = JSON.stringify({
        code: 'NOT_FOUND',
        message: 'Resource not found',
      });

      expect(isTauriErrorJson(errorJson)).toBe(true);
    });

    it('should return false for invalid JSON', () => {
      expect(isTauriErrorJson('not json')).toBe(false);
    });

    it('should return false for non-string', () => {
      expect(isTauriErrorJson(123)).toBe(false);
    });

    it('should return false for JSON without required fields', () => {
      expect(isTauriErrorJson(JSON.stringify({ foo: 'bar' }))).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should return the error message', () => {
      const error: TauriError = {
        code: 'DATABASE_ERROR',
        message: 'Connection failed',
      };

      expect(getErrorMessage(error)).toBe('Connection failed');
    });

    it('should return default message if message is empty', () => {
      const error: TauriError = {
        code: 'DATABASE_ERROR',
        message: '',
      };

      expect(getErrorMessage(error)).toBe('A database error occurred');
    });
  });

  describe('isErrorCode', () => {
    it('should return true for matching code', () => {
      const error: TauriError = {
        code: 'NOT_FOUND',
        message: 'Not found',
      };

      expect(isErrorCode(error, 'NOT_FOUND')).toBe(true);
    });

    it('should return false for non-matching code', () => {
      const error: TauriError = {
        code: 'NOT_FOUND',
        message: 'Not found',
      };

      expect(isErrorCode(error, 'DATABASE_ERROR')).toBe(false);
    });
  });

  describe('isRecoverableError', () => {
    it('should return true for recoverable errors', () => {
      const recoverableCodes = [
        'VALIDATION_ERROR',
        'NOT_FOUND',
        'FEATURE_NOT_AVAILABLE',
        'CANCELLED',
      ] as const;

      recoverableCodes.forEach((code) => {
        const error: TauriError = { code, message: 'test' };
        expect(isRecoverableError(error)).toBe(true);
      });
    });

    it('should return false for non-recoverable errors', () => {
      const nonRecoverableCodes = [
        'DATABASE_ERROR',
        'IO_ERROR',
        'INTERNAL_ERROR',
        'SERIALIZATION_ERROR',
      ] as const;

      nonRecoverableCodes.forEach((code) => {
        const error: TauriError = { code, message: 'test' };
        expect(isRecoverableError(error)).toBe(false);
      });
    });
  });
});
