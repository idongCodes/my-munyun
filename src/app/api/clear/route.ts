import { NextResponse } from 'next/server';
import { clearAccounts, clearTransactions, deleteCredential } from '@/lib/db';
import { getSessionUserId } from '@/lib/session';

export async function POST() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    await clearAccounts(userId);
    await clearTransactions(userId);
    await deleteCredential(userId, "access_token_boa");
    await deleteCredential(userId, "access_token_cashapp");
    await deleteCredential(userId, "item_id_boa");
    await deleteCredential(userId, "item_id_cashapp");
    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
