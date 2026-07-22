import { NextResponse } from 'next/server';
import { getCredential } from '@/lib/db';
import { plaidClient, isPlaidConfigured } from '@/lib/plaid';
import { Products, CountryCode } from 'plaid';
import { getSessionUserId } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const useMockCred = await getCredential(userId, 'use_mock_data');
    const useMockData = useMockCred === null 
      ? (process.env.USE_MOCK_DATA || 'true').toLowerCase() === 'true' 
      : useMockCred.toLowerCase() === 'true';

    const activeUseMock = !isPlaidConfigured || useMockData;

    if (activeUseMock) {
      return NextResponse.json({ link_token: "mock_link_token" });
    }

    const redirectUri = process.env.PLAID_REDIRECT_URI;

    const linkTokenParams: any = {
      client_name: "Munyun Finance",
      language: "en",
      country_codes: [CountryCode.Us],
      user: {
        client_user_id: userId
      },
      products: [Products.Transactions]
    };

    if (redirectUri) {
      linkTokenParams.redirect_uri = redirectUri;
    }

    const response = await plaidClient.linkTokenCreate(linkTokenParams);

    return NextResponse.json({ link_token: response.data.link_token });
  } catch (error: any) {
    console.error("Error creating Link Token:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
