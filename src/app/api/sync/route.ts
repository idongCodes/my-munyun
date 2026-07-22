import { NextResponse } from 'next/server';
import { getCredential } from '@/lib/db';
import { isPlaidConfigured } from '@/lib/plaid';
import { generateMockData } from '@/lib/mock';
import { syncItemData } from '@/lib/sync-helper';
import { getSessionUserId } from '@/lib/session';

export async function POST() {
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
      await generateMockData(userId);
      return NextResponse.json({ status: "success", message: "Mock data refreshed." });
    }

    const boaToken = await getCredential(userId, "access_token_boa");
    const cashappToken = await getCredential(userId, "access_token_cashapp");

    const synced: string[] = [];
    if (boaToken) {
      await syncItemData(boaToken, "boa", userId);
      synced.push("boa");
    }
    if (cashappToken) {
      await syncItemData(cashappToken, "cashapp", userId);
      synced.push("cashapp");
    }

    return NextResponse.json({ status: "success", synced });
  } catch (error: any) {
    console.error("Error syncing account data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
