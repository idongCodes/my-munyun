-- My Munyun Supabase Production Database Schema (Multi-User Refactored)

-- 1. User Profiles & Registrations
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  preferred_name TEXT,
  mobile_number TEXT,
  password TEXT, -- Encrypted/Hashed password
  totp_secret TEXT,
  totp_enabled BOOLEAN DEFAULT FALSE,
  google_id TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Credentials / System Settings (Plaid Tokens, OTP codes, etc. scoped to user)
CREATE TABLE IF NOT EXISTS credentials (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, key)
);

-- 3. Connected Financial Accounts
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  mask TEXT,
  type TEXT,
  subtype TEXT,
  balance_available NUMERIC,
  balance_current NUMERIC,
  institution TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Financial Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Uncategorized',
  account_id TEXT REFERENCES accounts(id) ON DELETE CASCADE,
  account_name TEXT,
  institution TEXT,
  notes TEXT,
  pending BOOLEAN DEFAULT FALSE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. User Budgets (Composite Primary Key: user_id + category)
CREATE TABLE IF NOT EXISTS budgets (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  limit_amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, category)
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Note: Because this application uses the SUPABASE_SERVICE_ROLE_KEY to execute operations 
-- from Next.js server-side route handlers, RLS policies are bypassed automatically. 
-- This ensures security (users cannot write to the database from their browser directly) 
-- while allowing the Next.js server to fetch and write scoped user data securely.
