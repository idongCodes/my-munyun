import { NextResponse } from 'next/server';
import { getTransactions, getAccounts, updateTransaction } from '@/lib/db';
import { getSessionUserId } from '@/lib/session';

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const transactions = await getTransactions(userId);
    const accounts = await getAccounts(userId);
    return NextResponse.json({ transactions, accounts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { id, category, notes } = body;
    if (!id || !category) {
      return NextResponse.json({ error: "Missing required fields: id and category" }, { status: 400 });
    }
    await updateTransaction(id, category, notes || "", userId);
    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
