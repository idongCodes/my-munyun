import { NextResponse } from 'next/server';
import { setCredential, clearAccounts, clearTransactions } from '@/lib/db';
import { generateMockData } from '@/lib/mock';
import { isPlaidConfigured } from '@/lib/plaid';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const useMock = body.use_mock;

    if (!isPlaidConfigured) {
      return NextResponse.json({
        status: "success",
        use_mock_data: true,
        message: "Plaid keys not configured. Forcing mock mode."
      });
    }

    await setCredential("use_mock_data", String(useMock));

    if (useMock) {
      await generateMockData();
    } else {
      await clearAccounts();
      await clearTransactions();
    }

    return NextResponse.json({
      status: "success",
      use_mock_data: useMock
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
