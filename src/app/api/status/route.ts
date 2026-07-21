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

  const firstName = await getCredential('user_firstName') || '';
  const lastName = await getCredential('user_lastName') || '';
  const preferredName = await getCredential('user_preferredName') || '';
  const primaryGoal = await getCredential('user_primaryGoal') || 'budget';
  const email = await getCredential('user_email') || '';
  const mobileNumber = await getCredential('user_mobileNumber') || '';
  const nameLastUpdatedAt = await getCredential('user_name_last_updated_at') || '';

  return NextResponse.json({
    is_plaid_configured: isPlaidConfigured,
    use_mock_data: activeUseMock,
    plaid_env: process.env.PLAID_ENV || 'sandbox',
    boa_linked: boaLinked,
    cashapp_linked: cashappLinked,
    first_name: firstName,
    last_name: lastName,
    preferred_name: preferredName,
    primary_goal: primaryGoal,
    email: email,
    mobile_number: mobileNumber,
    name_last_updated_at: nameLastUpdatedAt,
    supabase_active: isSupabaseConfigured(),
  });
}
