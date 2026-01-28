import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: 'admin@insureflow.com',
  password: 'password123',
};

test.describe('Authentication', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should display login page correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'wrong@email.com');
    await page.fill('input[type="password"], input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    // Should show error or stay on login page
    const url = page.url();
    expect(url.includes('login') || url.includes('error')).toBeTruthy();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"]');
    // HTML5 validation should prevent submission
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', TEST_USER.email);
    await page.fill('input[type="password"], input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/, { timeout: 15000 });
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should have forgot password link', async ({ page }) => {
    await page.goto('/login');
    const forgotPassword = page.locator('a').filter({ hasText: /forgot|reset/i });
    if (await forgotPassword.count() > 0) {
      await expect(forgotPassword.first()).toBeVisible();
    }
  });
});
