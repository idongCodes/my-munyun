import { NextResponse } from 'next/server';
import { clearAccounts, clearTransactions, deleteCredential } from '@/lib/db';

export async function POST() {
  try {
    await clearAccounts();
    await clearTransactions();
    await deleteCredential("access_token_boa");
    await deleteCredential("access_token_cashapp");
    await deleteCredential("item_id_boa");
    await deleteCredential("item_id_cashapp");
    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
