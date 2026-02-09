/**
 * Example unit test to verify Jest setup is working correctly.
 * This file can be deleted once real tests are added.
 */

describe('Jest Setup Verification', () => {
  it('should run basic assertions', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle string assertions', () => {
    expect('SecureBank').toContain('Bank');
  });

  it('should handle array assertions', () => {
    const accounts = ['checking', 'savings'];
    expect(accounts).toHaveLength(2);
    expect(accounts).toContain('checking');
  });

  it('should handle object assertions', () => {
    const user = {
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };
    expect(user).toHaveProperty('email');
    expect(user.email).toBe('test@example.com');
  });

  it('should handle async operations', async () => {
    const fetchData = (): Promise<string> => {
      return new Promise((resolve) => {
        setTimeout(() => resolve('data'), 100);
      });
    };
    const result = await fetchData();
    expect(result).toBe('data');
  });
});

