import { clearAccounts, clearTransactions, saveAccounts, saveTransactions } from './db';

export async function generateMockData() {
  await clearAccounts();
  await clearTransactions();

  const mockAccounts = [
    {
      id: "mock_boa_checking",
      name: "BoA Advantage Checking",
      mask: "4829",
      type: "depository",
      subtype: "checking",
      balance_available: 5240.23,
      balance_current: 5240.23,
      institution: "Bank of America"
    },
    {
      id: "mock_boa_savings",
      name: "BoA Preferred Savings",
      mask: "8812",
      type: "depository",
      subtype: "savings",
      balance_available: 18450.00,
      balance_current: 18450.00,
      institution: "Bank of America"
    },
    {
      id: "mock_cashapp",
      name: "Cash App Balance",
      mask: "9931",
      type: "depository",
      subtype: "checking",
      balance_available: 320.50,
      balance_current: 320.50,
      institution: "Cash App (Lincoln Savings)"
    }
  ];
  await saveAccounts(mockAccounts);

  const categories = ["Income", "Groceries", "Dining", "Subscriptions", "Transfers", "Shopping", "Utilities", "Travel"];
  const merchants: Record<string, [string, number][]> = {
    Income: [["Direct Deposit / Payroll", 2500.00]],
    Groceries: [["Trader Joe's", -124.50], ["Whole Foods", -89.20], ["Safeway", -54.30]],
    Dining: [["Starbucks", -6.25], ["Chipotle", -14.50], ["Sweetgreen", -16.80], ["Uber Eats", -32.40]],
    Subscriptions: [["Netflix", -15.49], ["Spotify", -10.99], ["ChatGPT Plus", -20.00]],
    Transfers: [["Cash App Sent to Alice", -40.00], ["Cash App Received from Bob", 15.00], ["Cash App Cash Out", 200.00]],
    Shopping: [["Amazon.com", -89.99], ["Target", -42.15], ["Apple Store", -129.00]],
    Utilities: [["Comcast Internet", -79.99], ["ConEd Utility Bill", -112.40]],
    Travel: [["Uber", -18.50], ["Lyft", -15.20], ["Chevron Gas Station", -45.00]]
  };

  const mockTxs: any[] = [];
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 30);

  let txIdCounter = 1;

  // Add regular direct deposit twice a month
  for (let d of [1, 15]) {
    const txDate = new Date(startDate);
    txDate.setDate(d);
    if (txDate <= today) {
      mockTxs.push({
        id: `tx_mock_${txIdCounter}`,
        date: txDate.toISOString().split('T')[0],
        amount: -2500.00,
        name: "Direct Deposit / Payroll",
        category: "Income",
        account_id: "mock_boa_checking",
        account_name: "BoA Advantage Checking",
        institution: "Bank of America",
        pending: false
      });
      txIdCounter++;
    }
  }

  // Generate random daily transactions
  const currDate = new Date(startDate);
  while (currDate <= today) {
    if (currDate.getDate() === 1 || currDate.getDate() === 15) {
      currDate.setDate(currDate.getDate() + 1);
      continue;
    }

    if (Math.random() < 0.7) {
      const cat = categories[Math.floor(Math.random() * (categories.length - 1)) + 1];
      const options = merchants[cat];
      const [merchantName, baseAmount] = options[Math.floor(Math.random() * options.length)];

      const variance = 0.8 + Math.random() * 0.4;
      const amount = Math.round(baseAmount * variance * 100) / 100;

      let accId: string;
      let accName: string;
      let inst: string;
      let plaidAmount: number;

      if (cat === "Transfers" || merchantName.startsWith("Cash App")) {
        accId = "mock_cashapp";
        accName = "Cash App Balance";
        inst = "Cash App (Lincoln Savings)";
        plaidAmount = merchantName.includes("Received") ? -amount : Math.abs(amount);
      } else {
        accId = Math.random() < 0.5 ? "mock_boa_checking" : "mock_boa_savings";
        accName = accId === "mock_boa_checking" ? "BoA Advantage Checking" : "BoA Preferred Savings";
        inst = "Bank of America";
        plaidAmount = Math.abs(amount);
      }

      mockTxs.push({
        id: `tx_mock_${txIdCounter}`,
        date: currDate.toISOString().split('T')[0],
        amount: plaidAmount,
        name: merchantName,
        category: cat,
        account_id: accId,
        account_name: accName,
        institution: inst,
        pending: false
      });
      txIdCounter++;
    }

    currDate.setDate(currDate.getDate() + 1);
  }

  await saveTransactions(mockTxs);
}
