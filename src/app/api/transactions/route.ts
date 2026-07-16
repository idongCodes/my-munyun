import { NextResponse } from 'next/server';
import { getTransactions, getAccounts, updateTransaction } from '@/lib/db';

export async function GET() {
  try {
    const transactions = await getTransactions();
    const accounts = await getAccounts();
    return NextResponse.json({ transactions, accounts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, category, notes } = body;
    if (!id || !category) {
      return NextResponse.json({ error: "Missing required fields: id and category" }, { status: 400 });
    }
    await updateTransaction(id, category, notes || "");
    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
