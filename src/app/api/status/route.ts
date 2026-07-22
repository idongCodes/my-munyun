import { NextResponse } from 'next/server';
import { getCredential, initDb, getUserById } from '@/lib/db';
import { isPlaidConfigured } from '@/lib/plaid';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getSessionUserId } from '@/lib/session';

export async function GET() {
  await initDb();
  
  const userId = await getSessionUserId();
  let user: any = null;
  if (userId) {
    user = await getUserById(userId);
  }

  const useMockCred = userId ? await getCredential(userId, 'use_mock_data') : null;
  const useMockData = useMockCred === null 
    ? (process.env.USE_MOCK_DATA || 'true').toLowerCase() === 'true' 
    : useMockCred.toLowerCase() === 'true';
    
  const forceMock = !isPlaidConfigured;
  const activeUseMock = forceMock ? true : useMockData;

  const boaLinked = userId ? (await getCredential(userId, 'access_token_boa') !== null) : false;
  const cashappLinked = userId ? (await getCredential(userId, 'access_token_cashapp') !== null) : false;

  const firstName = user ? user.first_name : '';
  const lastName = user ? user.last_name : '';
  const preferredName = user ? user.preferred_name : '';
  const primaryGoal = userId ? (await getCredential(userId, 'user_primaryGoal') || 'budget') : 'budget';
  const email = user ? user.email : '';
  const mobileNumber = user ? user.mobile_number : '';
  const nameLastUpdatedAt = userId ? (await getCredential(userId, 'user_name_last_updated_at') || '') : '';

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
    google_linked: user && user.google_id ? true : false,
    has_password: user && user.password ? true : false,
  });
}
