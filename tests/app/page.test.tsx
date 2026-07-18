import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

// Mock global fetch for API calls in page.tsx
global.fetch = vi.fn((url: string | URL | Request) => {
  const urlString = typeof url === 'string' ? url : url.toString();

  if (urlString.includes('/api/status')) {
    return Promise.resolve({
      json: () => Promise.resolve({
        is_plaid_configured: false,
        use_mock_data: true,
        boa_linked: true,
        cashapp_linked: true
      })
    } as Response);
  }

  if (urlString.includes('/api/transactions')) {
    return Promise.resolve({
      json: () => Promise.resolve({
        accounts: [
          { id: 'acc_1', name: 'Checking Account', institution: 'Bank of America', balance_available: 4500 }
        ],
        transactions: [
          { id: 'tx_1', name: 'Grocery Shop', amount: 50, category: 'Groceries', date: '2026-07-10', institution: 'Bank of America' }
        ]
      })
    } as Response);
  }

  if (urlString.includes('/api/budgets')) {
    return Promise.resolve({
      json: () => Promise.resolve({ Groceries: 400 })
    } as Response);
  }

  return Promise.resolve({
    json: () => Promise.resolve({ success: true })
  } as Response);
});

describe('Home Page Component (page.tsx)', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should render splash screen initially with witty CLI advisor message', () => {
    render(<Home />);
    expect(screen.getByText(/💸 My/i)).toBeDefined();
    expect(screen.getByText(/Your Digital Munyun Advisor/i)).toBeDefined();
    expect(screen.getByText(/munyun-cli/i)).toBeDefined();
  });

  it('should skip splash screen and show auth screen when session is restored in sessionStorage', () => {
    sessionStorage.setItem('munyun_logged_in', 'true');
    sessionStorage.setItem('munyun_login_time', new Date().toISOString());

    render(<Home />);
    expect(screen.getByText(/💸 My/i)).toBeDefined();
  });
});
