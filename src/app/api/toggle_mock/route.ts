import { NextResponse } from 'next/server';
import { setCredential, clearAccounts, clearTransactions } from '@/lib/db';
import { generateMockData } from '@/lib/mock';
import { isPlaidConfigured } from '@/lib/plaid';
import { getSessionUserId } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const useMock = body.use_mock;

    if (!isPlaidConfigured) {
      return NextResponse.json({
        status: "success",
        use_mock_data: true,
        message: "Plaid keys not configured. Forcing mock mode."
      });
    }

    await setCredential(userId, "use_mock_data", String(useMock));

    if (useMock) {
      await generateMockData(userId);
    } else {
      await clearAccounts(userId);
      await clearTransactions(userId);
    }

    return NextResponse.json({
      status: "success",
      use_mock_data: useMock
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
