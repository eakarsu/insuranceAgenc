import { test as base, expect } from '@playwright/test';

// Extend base test with authenticated user
export const test = base.extend<{ authenticatedPage: typeof base }>({
  authenticatedPage: async ({ page }, use) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'agent@test.com');
    await page.fill('input[type="password"], input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL(/.*dashboard/, { timeout: 15000 });

    await use(base);
  },
});

export { expect };
