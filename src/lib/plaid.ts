import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const plaidClientId = process.env.PLAID_CLIENT_ID || '';
const plaidSecret = process.env.PLAID_SECRET || '';
const plaidEnv = process.env.PLAID_ENV || 'sandbox';

export const isPlaidConfigured = Boolean(plaidClientId && plaidSecret);

const envMap: Record<string, string> = {
  sandbox: PlaidEnvironments.sandbox,
  development: PlaidEnvironments.development,
  production: PlaidEnvironments.production,
};

const configuration = new Configuration({
  basePath: envMap[plaidEnv] || PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': plaidClientId,
      'PLAID-SECRET': plaidSecret,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);
