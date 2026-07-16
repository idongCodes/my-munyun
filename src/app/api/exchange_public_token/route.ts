import { NextResponse } from 'next/server';
import { getCredential, setCredential } from '@/lib/db';
import { plaidClient, isPlaidConfigured } from '@/lib/plaid';
import { generateMockData } from '@/lib/mock';
import { syncItemData } from '@/lib/sync-helper';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { public_token, institution } = body;

    const useMockCred = await getCredential('use_mock_data');
    const useMockData = useMockCred === null 
      ? (process.env.USE_MOCK_DATA || 'true').toLowerCase() === 'true' 
      : useMockCred.toLowerCase() === 'true';

    const activeUseMock = !isPlaidConfigured || useMockData;

    if (activeUseMock) {
      await setCredential(`access_token_${institution}`, `mock_access_token_${institution}`);
      await generateMockData();
      return NextResponse.json({ status: "success" });
    }

    const response = await plaidClient.itemPublicTokenExchange({
      public_token: public_token
    });

    const access_token = response.data.access_token;
    const item_id = response.data.item_id;

    await setCredential(`access_token_${institution}`, access_token);
    await setCredential(`item_id_${institution}`, item_id);

    // Fetch initial balances and transactions
    await syncItemData(access_token, institution);

    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    console.error("Error exchanging public token:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
