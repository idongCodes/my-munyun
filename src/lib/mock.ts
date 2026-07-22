import { saveAccounts, saveTransactions, getDb } from './db';
import { supabase, isSupabaseConfigured } from './supabase';

const INSTITUTION_MAP: Record<string, { name: string; accounts: any[] }> = {
  chase: {
    name: "Chase Bank",
    accounts: [
      { id: "mock_chase_checking", name: "Chase Total Checking", mask: "1284", type: "depository", subtype: "checking", balance_available: 3450.80, balance_current: 3450.80 },
      { id: "mock_chase_savings", name: "Chase Premier Savings", mask: "9921", type: "depository", subtype: "savings", balance_available: 12000.00, balance_current: 12000.00 },
      { id: "mock_chase_credit", name: "Chase Sapphire Preferred", mask: "0029", type: "credit", subtype: "credit card", balance_available: 8579.50, balance_current: 1420.50 }
    ]
  },
  boa: {
    name: "Bank of America",
    accounts: [
      { id: "mock_boa_checking", name: "BoA Advantage Checking", mask: "4829", type: "depository", subtype: "checking", balance_available: 5240.23, balance_current: 5240.23 },
      { id: "mock_boa_savings", name: "BoA Preferred Savings", mask: "8812", type: "depository", subtype: "savings", balance_available: 18450.00, balance_current: 18450.00 },
      { id: "mock_boa_credit", name: "Custom Cash Rewards", mask: "1192", type: "credit", subtype: "credit card", balance_available: 4550.00, balance_current: 450.00 }
    ]
  },
  wells: {
    name: "Wells Fargo",
    accounts: [
      { id: "mock_wells_checking", name: "Everyday Checking", mask: "6621", type: "depository", subtype: "checking", balance_available: 1890.45, balance_current: 1890.45 },
      { id: "mock_wells_savings", name: "Way2Save Savings", mask: "4491", type: "depository", subtype: "savings", balance_available: 5000.00, balance_current: 5000.00 }
    ]
  },
  citi: {
    name: "Citibank",
    accounts: [
      { id: "mock_citi_checking", name: "Citi Access Account", mask: "0931", type: "depository", subtype: "checking", balance_available: 2900.00, balance_current: 2900.00 },
      { id: "mock_citi_credit", name: "Citi Double Cash", mask: "7742", type: "credit", subtype: "credit card", balance_available: 4109.70, balance_current: 890.30 }
    ]
  },
  capone: {
    name: "Capital One",
    accounts: [
      { id: "mock_capone_checking", name: "360 Checking", mask: "2201", type: "depository", subtype: "checking", balance_available: 4120.15, balance_current: 4120.15 },
      { id: "mock_capone_credit", name: "Venture X Card", mask: "8890", type: "credit", subtype: "credit card", balance_available: 7650.00, balance_current: 2350.00 }
    ]
  },
  usbank: {
    name: "U.S. Bank",
    accounts: [
      { id: "mock_usbank_checking", name: "Smartly Checking", mask: "5532", type: "depository", subtype: "checking", balance_available: 3100.40, balance_current: 3100.40 }
    ]
  },
  fidelity: {
    name: "Fidelity",
    accounts: [
      { id: "mock_fidelity_brokerage", name: "Fidelity Brokerage Account", mask: "4920", type: "depository", subtype: "brokerage", balance_available: 45000.00, balance_current: 45000.00 }
    ]
  },
  usaa: {
    name: "USAA",
    accounts: [
      { id: "mock_usaa_checking", name: "Classic Checking", mask: "9102", type: "depository", subtype: "checking", balance_available: 6700.50, balance_current: 6700.50 }
    ]
  },
  td: {
    name: "TD Bank",
    accounts: [
      { id: "mock_td_checking", name: "Convenience Checking", mask: "3381", type: "depository", subtype: "checking", balance_available: 1540.20, balance_current: 1540.20 }
    ]
  },
  navyfederal: {
    name: "Navy Federal Credit Union",
    accounts: [
      { id: "mock_navy_checking", name: "Active Duty Checking", mask: "1923", type: "depository", subtype: "checking", balance_available: 4200.75, balance_current: 4200.75 }
    ]
  },
  schwab: {
    name: "Charles Schwab",
    accounts: [
      { id: "mock_schwab_brokerage", name: "Schwab One Brokerage", mask: "7721", type: "depository", subtype: "checking", balance_available: 28500.00, balance_current: 28500.00 }
    ]
  },
  pnc: {
    name: "PNC Bank",
    accounts: [
      { id: "mock_pnc_checking", name: "Virtual Wallet Checking", mask: "4029", type: "depository", subtype: "checking", balance_available: 2150.60, balance_current: 2150.60 }
    ]
  },
  cashapp: {
    name: "Cash App",
    accounts: [
      { id: "mock_cashapp", name: "Cash App Balance", mask: "9931", type: "depository", subtype: "checking", balance_available: 320.50, balance_current: 320.50 }
    ]
  }
};

export async function generateMockData(userId: string, institutionCode?: string) {
  let finalUserId = userId;
  let finalInstCode = institutionCode;

  // Detect legacy single-argument call (e.g. generateMockData('boa'))
  if (institutionCode === undefined && INSTITUTION_MAP[userId] !== undefined) {
    finalUserId = '00000000-0000-0000-0000-000000000000';
    finalInstCode = userId;
  }

  let institutionsToSync: string[] = [];
  if (finalInstCode) {
    institutionsToSync = [finalInstCode];
  } else {
    // Find all active connected institutions for this specific user
    if (isSupabaseConfigured() && supabase) {
      const { data } = await supabase
        .from('credentials')
        .select('key')
        .eq('user_id', finalUserId)
        .like('key', 'access_token_%');
      if (data) {
        institutionsToSync = data.map((r: any) => r.key.replace('access_token_', ''));
      }
    } else {
      const db = await getDb();
      const rows = await db.all("SELECT key FROM credentials WHERE user_id = ? AND key LIKE 'access_token_%'", finalUserId);
      institutionsToSync = rows.map((r: any) => r.key.replace('access_token_', ''));
    }
  }

  // If no institution parameter is provided and no accounts are linked yet, do nothing.
  if (institutionsToSync.length === 0) {
    return;
  }

  for (const instCode of institutionsToSync) {
    const config = INSTITUTION_MAP[instCode];
    if (!config) continue;

    const instName = config.name;

    // 1. Clear old data specifically for this institution and user (additive style)
    if (isSupabaseConfigured() && supabase) {
      await supabase.from('accounts').delete().eq('user_id', finalUserId).eq('institution', instName);
      await supabase.from('transactions').delete().eq('user_id', finalUserId).eq('institution', instName);
    } else {
      const db = await getDb();
      await db.run('DELETE FROM accounts WHERE user_id = ? AND institution = ?', finalUserId, instName);
      await db.run('DELETE FROM transactions WHERE user_id = ? AND institution = ?', finalUserId, instName);
    }

    // 2. Save accounts
    const accountsWithInst = config.accounts.map(acc => ({
      ...acc,
      institution: instName
    }));
    await saveAccounts(accountsWithInst, finalUserId);

    // 3. Generate 30 days of transactions
    const categories = ["Income", "Groceries", "Dining", "Subscriptions", "Transfers", "Shopping", "Utilities", "Travel"];
    const merchants: Record<string, [string, number][]> = {
      Income: [["Direct Deposit / Payroll", 2500.00], ["Freelance Payment", 450.00]],
      Groceries: [["Trader Joe's", -124.50], ["Whole Foods", -89.20], ["Safeway", -54.30]],
      Dining: [["Starbucks", -6.25], ["Chipotle", -14.50], ["Sweetgreen", -16.80], ["Uber Eats", -32.40]],
      Subscriptions: [["Netflix", -15.49], ["Spotify", -10.99], ["ChatGPT Plus", -20.00]],
      Transfers: [["Cash App Sent to Alice", -40.00], ["Cash App Received from Bob", 15.00]],
      Shopping: [["Amazon.com", -89.99], ["Target", -42.15], ["Apple Store", -129.00]],
      Utilities: [["Comcast Internet", -79.99], ["ConEd Utility Bill", -112.40]],
      Travel: [["Uber", -18.50], ["Lyft", -15.20], ["Chevron Gas Station", -45.00]]
    };

    const mockTxs: any[] = [];
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 30);

    let txIdCounter = 1;

    // Use checking account if available, otherwise fallback to the first account
    const checkingAccount = accountsWithInst.find(a => a.subtype === 'checking');
    const checkingId = checkingAccount ? checkingAccount.id : accountsWithInst[0].id;
    const checkingName = checkingAccount ? checkingAccount.name : accountsWithInst[0].name;

    // Direct deposits twice a month
    for (let d of [1, 15]) {
      const txDate = new Date(startDate);
      txDate.setDate(d);
      if (txDate <= today) {
        mockTxs.push({
          id: `tx_mock_${instCode}_${txIdCounter}`,
          date: txDate.toISOString().split('T')[0],
          amount: -2500.00, // deposits are negative in Plaid
          name: "Direct Deposit / Payroll",
          category: "Income",
          account_id: checkingId,
          account_name: checkingName,
          institution: instName,
          pending: false
        });
        txIdCounter++;
      }
    }

    // Random spending transactions
    const currDate = new Date(startDate);
    while (currDate <= today) {
      if (currDate.getDate() === 1 || currDate.getDate() === 15) {
        currDate.setDate(currDate.getDate() + 1);
        continue;
      }

      if (Math.random() < 0.6) {
        const cat = categories[Math.floor(Math.random() * (categories.length - 1)) + 1];
        const options = merchants[cat];
        const [merchantName, baseAmount] = options[Math.floor(Math.random() * options.length)];

        const variance = 0.8 + Math.random() * 0.4;
        const amount = Math.round(baseAmount * variance * 100) / 100;

        let selectedAcc = accountsWithInst[0];
        if (accountsWithInst.length > 1) {
          const creditCard = accountsWithInst.find(a => a.type === 'credit');
          if (creditCard && ['Shopping', 'Dining', 'Travel', 'Subscriptions'].includes(cat) && Math.random() < 0.7) {
            selectedAcc = creditCard;
          } else {
            selectedAcc = checkingAccount || accountsWithInst[0];
          }
        }

        const plaidAmount = merchantName.includes("Received") ? -amount : Math.abs(amount);

        mockTxs.push({
          id: `tx_mock_${instCode}_${txIdCounter}`,
          date: currDate.toISOString().split('T')[0],
          amount: plaidAmount,
          name: merchantName,
          category: cat,
          account_id: selectedAcc.id,
          account_name: selectedAcc.name,
          institution: instName,
          pending: false
        });
        txIdCounter++;
      }

      currDate.setDate(currDate.getDate() + 1);
    }

    await saveTransactions(mockTxs, finalUserId);
  }
}
