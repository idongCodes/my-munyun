import { plaidClient } from './plaid';
import { saveAccounts, saveTransactions } from './db';

export async function syncItemData(accessToken: string, institution: string, userId: string) {
  try {
    const instName = institution === 'boa' ? 'Bank of America' : 'Cash App';

    // 1. Fetch Balances
    const balanceResponse = await plaidClient.accountsBalanceGet({
      access_token: accessToken,
    });

    const accountsToSave = balanceResponse.data.accounts.map((acc: any) => ({
      id: acc.account_id,
      name: acc.name,
      mask: acc.mask,
      type: acc.type,
      subtype: acc.subtype,
      balance_available: acc.balances.available,
      balance_current: acc.balances.current,
      institution: instName,
    }));
    await saveAccounts(accountsToSave, userId);

    // 2. Fetch Transactions (last 30 days)
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 30);

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = today.toISOString().split('T')[0];

    const txResponse = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startStr,
      end_date: endStr,
      options: {
        count: 100
      }
    });

    const txsToSave = txResponse.data.transactions.map((tx: any) => ({
      id: tx.transaction_id,
      date: tx.date,
      amount: Number(tx.amount),
      name: tx.merchant_name || tx.name,
      category: tx.category && tx.category.length > 0 ? tx.category[0] : 'Uncategorized',
      account_id: tx.account_id,
      account_name: balanceResponse.data.accounts.find((a: any) => a.account_id === tx.account_id)?.name || null,
      institution: instName,
      pending: tx.pending,
    }));
    await saveTransactions(txsToSave, userId);

  } catch (error) {
    console.error(`Error syncing data for ${institution}:`, error);
    throw error;
  }
}
