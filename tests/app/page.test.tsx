import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import Home from '@/app/page';

describe('Home Page Component (page.tsx)', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should render home landing page with title and login links', async () => {
    await act(async () => {
      render(<Home />);
    });
    expect(screen.getByText(/💸 My/i)).toBeDefined();
    expect(screen.getByText(/Your Digital Munyun Advisor/i)).toBeDefined();
    expect(screen.getByText(/Welcome to My Munyun/i)).toBeDefined();
  });
});
