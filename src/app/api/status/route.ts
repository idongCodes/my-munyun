import { NextResponse } from 'next/server';
import { getCredential, initDb } from '@/lib/db';
import { isPlaidConfigured } from '@/lib/plaid';

export async function GET() {
  await initDb();
  
  const useMockCred = await getCredential('use_mock_data');
  const useMockData = useMockCred === null 
    ? (process.env.USE_MOCK_DATA || 'true').toLowerCase() === 'true' 
    : useMockCred.toLowerCase() === 'true';
    
  const forceMock = !isPlaidConfigured;
  const activeUseMock = forceMock ? true : useMockData;

  const boaLinked = await getCredential('access_token_boa') !== null;
  const cashappLinked = await getCredential('access_token_cashapp') !== null;

  const preferredName = await getCredential('user_preferredName') || 'User';
  const primaryGoal = await getCredential('user_primaryGoal') || 'budget';
  const email = await getCredential('user_email') || 'user@example.com';

  return NextResponse.json({
    is_plaid_configured: isPlaidConfigured,
    use_mock_data: activeUseMock,
    plaid_env: process.env.PLAID_ENV || 'sandbox',
    boa_linked: boaLinked,
    cashapp_linked: cashappLinked,
    preferred_name: preferredName,
    primary_goal: primaryGoal,
    email: email,
  });
}
