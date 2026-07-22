import { beforeAll, vi } from 'vitest';
import fs from 'fs';

// Use temporary isolated test database
const TEST_DB_PATH = '/tmp/test_munyun.db';
process.env.DB_PATH = TEST_DB_PATH;
process.env.PASSCODE = '1234';
process.env.TOTP_SECRET = 'JBSWY3DPEHPK3PXP';

// Remove stale database to force fresh schema migrations
try {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
} catch (e) {
  console.warn('Failed to delete stale test database:', e);
}

// Mock the session module under its alias path
vi.mock('@/lib/session', () => {
  let tempSmsCookie = '';
  return {
    getSessionUserId: vi.fn().mockResolvedValue('00000000-0000-0000-0000-000000000000'),
    setSessionCookie: vi.fn().mockResolvedValue(undefined),
    clearSessionCookie: vi.fn().mockResolvedValue(undefined),
    encryptSession: vi.fn().mockImplementation((val: string) => val),
    decryptSession: vi.fn().mockImplementation((val: string) => val),
    setTempSmsCookie: vi.fn().mockImplementation(async (val: string) => {
      tempSmsCookie = val;
    }),
    getTempSmsCookie: vi.fn().mockImplementation(async () => {
      return tempSmsCookie;
    }),
    clearTempSmsCookie: vi.fn().mockImplementation(async () => {
      tempSmsCookie = '';
    })
  };
});

beforeAll(async () => {
  // Setup clean global test environment
});
