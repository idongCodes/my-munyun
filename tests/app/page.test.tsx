import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import Home from '@/app/page';

describe('Home Page Component (page.tsx)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render splash screen CLI animation whenever visiting /', async () => {
    await act(async () => {
      render(<Home />);
    });
    expect(screen.getByText(/💸 My/i)).toBeDefined();
    expect(screen.getByText(/Your Digital Munyun Advisor/i)).toBeDefined();
    expect(screen.getByText(/munyun-cli/i)).toBeDefined();
  });

  it('should play splash screen for at least 5 seconds before showing home landing page', async () => {
    await act(async () => {
      render(<Home />);
    });
    
    // Fast-forward 5000ms timer
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText(/💸 My/i)).toBeDefined();
    expect(screen.getByText(/Welcome to My Munyun/i)).toBeDefined();
  });
});
