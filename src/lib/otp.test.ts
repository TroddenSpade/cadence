import { describe, expect, it } from 'vitest';
import { isEmailCodeComplete, normalizeEmailCode } from './otp';

describe('email sign-in codes', () => {
  it('keeps only the first six digits from pasted input', () => {
    expect(normalizeEmailCode('123456')).toBe('123456');
    expect(normalizeEmailCode(' 123 456 ')).toBe('123456');
    expect(normalizeEmailCode('12-34-56')).toBe('123456');
    expect(normalizeEmailCode('1234567')).toBe('123456');
    expect(normalizeEmailCode('abc')).toBe('');
  });

  it('accepts only a complete six-digit code', () => {
    expect(isEmailCodeComplete('123456')).toBe(true);
    expect(isEmailCodeComplete(' 12 34 56 ')).toBe(true);
    expect(isEmailCodeComplete('12345')).toBe(false);
    expect(isEmailCodeComplete('12345a')).toBe(false);
    expect(isEmailCodeComplete('')).toBe(false);
  });
});
