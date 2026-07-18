import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import Home from '@/app/page';

describe('Home Page Component (page.tsx)', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should render splash screen CLI animation initially on load', async () => {
    await act(async () => {
      render(<Home />);
    });
    expect(screen.getByText(/💸 My/i)).toBeDefined();
    expect(screen.getByText(/Your Digital Munyun Advisor/i)).toBeDefined();
    expect(screen.getByText(/munyun-cli/i)).toBeDefined();
  });

  it('should skip splash screen and render home landing page when splash was previously shown', async () => {
    sessionStorage.setItem('munyun_splash_shown', 'true');

    await act(async () => {
      render(<Home />);
    });
    expect(screen.getByText(/💸 My/i)).toBeDefined();
    expect(screen.getByText(/Welcome to My Munyun/i)).toBeDefined();
  });
});
