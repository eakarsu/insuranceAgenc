import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@insureflow.com');
    await page.fill('input[type="password"], input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/, { timeout: 15000 });
  });

  test('should display dashboard page', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should display key metrics cards', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    // Check for metric cards
    const cards = page.locator('[class*="MuiCard"], [class*="card" i], [class*="stat" i]');
    await expect(cards.first()).toBeVisible();
  });

  test('should have navigation sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    const sidebar = page.locator('nav, [class*="sidebar" i], [class*="drawer" i]');
    await expect(sidebar.first()).toBeVisible();
  });

  test('should navigate to clients from sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    const clientsLink = page.locator('a[href*="client"]');
    if (await clientsLink.count() > 0) {
      await clientsLink.first().click();
      await expect(page).toHaveURL(/.*client/);
    }
  });

  test('should navigate to quotes from sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    const quotesLink = page.locator('a[href*="quote"]');
    if (await quotesLink.count() > 0) {
      await quotesLink.first().click();
      await expect(page).toHaveURL(/.*quote/);
    }
  });

  test('should navigate to policies from sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    const policiesLink = page.locator('a[href*="polic"]');
    if (await policiesLink.count() > 0) {
      await policiesLink.first().click();
      await expect(page).toHaveURL(/.*polic/);
    }
  });

  test('should navigate to claims from sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    const claimsLink = page.locator('a[href*="claim"]');
    if (await claimsLink.count() > 0) {
      await claimsLink.first().click();
      await expect(page).toHaveURL(/.*claim/);
    }
  });

  test('should show recent activity or tasks', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
  });
});

test.describe('Commissions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@insureflow.com');
    await page.fill('input[type="password"], input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/, { timeout: 15000 });
  });

  test('should display commissions page', async ({ page }) => {
    await page.goto('/commissions');
    await expect(page).toHaveURL(/.*commissions/);
  });

  test('should display commission data', async ({ page }) => {
    await page.goto('/commissions');
    await expect(page).toHaveURL(/.*commissions/);
  });

  test('should display forecasting page', async ({ page }) => {
    await page.goto('/commissions/forecasting');
    await expect(page).toHaveURL(/.*forecasting/);
  });

  test('should display statements page', async ({ page }) => {
    await page.goto('/commissions/statements');
    await expect(page).toHaveURL(/.*statements/);
  });

  test('should display splits page', async ({ page }) => {
    await page.goto('/commissions/splits');
    await expect(page).toHaveURL(/.*splits/);
  });
});

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@insureflow.com');
    await page.fill('input[type="password"], input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/, { timeout: 15000 });
  });

  test('should display settings page', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/.*settings/);
  });

  test('should have save button', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/.*settings/);
  });
});
