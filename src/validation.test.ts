import { validateUserId } from './your-validation-file'; // Wstaw tutaj ścieżkę do pliku zawierającego funkcję walidującą

describe('validateUserId', () => {
  it('should return true for a valid user ID', () => {
    const userId = 'abc123';
    const isValid = validateUserId(userId);
    expect(isValid).toBe(true);
  });

  it('should return false for an invalid user ID', () => {
    const userId = 'invalid_id';
    const isValid = validateUserId(userId);
    expect(isValid).toBe(false);
  });

  it('should return false for an empty user ID', () => {
    const userId = '';
    const isValid = validateUserId(userId);
    expect(isValid).toBe(false);
  });
});
