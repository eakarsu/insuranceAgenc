import { test as base, expect, Page } from '@playwright/test';

// Test credentials from seed
export const TEST_USER = {
  email: 'john.smith@insureflow.com',
  password: 'password123',
};

// Helper to login
export async function login(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"], input[name="email"]', TEST_USER.email);
  await page.fill('input[type="password"], input[name="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*dashboard/, { timeout: 15000 });
}

// Extend base test with authenticated context
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await login(page);
    await use(page);
  },
});

export { expect };
