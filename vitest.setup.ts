import { beforeAll } from 'vitest';

// Use temporary isolated test database
process.env.DB_PATH = '/tmp/test_munyun.db';
process.env.PASSCODE = '1234';
process.env.TOTP_SECRET = 'JBSWY3DPEHPK3PXP';

beforeAll(() => {
  // Setup clean global test environment
});
