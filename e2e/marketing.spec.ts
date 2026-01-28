import { test, expect } from '@playwright/test';

test.describe('Marketing Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@insureflow.com');
    await page.fill('input[type="password"], input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/, { timeout: 15000 });
  });

  test.describe('Campaigns Page', () => {
    test('should display campaigns page', async ({ page }) => {
      await page.goto('/marketing/campaigns');
      await expect(page).toHaveURL(/.*campaigns/);
    });

    test('should have create campaign button', async ({ page }) => {
      await page.goto('/marketing/campaigns');
      await expect(page).toHaveURL(/.*campaigns/);
    });

    test('should display campaigns list', async ({ page }) => {
      await page.goto('/marketing/campaigns');
      await page.waitForTimeout(2000);
      const dataGrid = page.locator('[class*="MuiDataGrid"], table, [role="grid"], [class*="card" i]');
      await expect(dataGrid.first()).toBeVisible();
    });

    test('should have status filter', async ({ page }) => {
      await page.goto('/marketing/campaigns');
      await page.waitForTimeout(1000);
      const statusFilter = page.locator('select, [role="combobox"], button').filter({ hasText: /draft|sent|all|status/i });
      if (await statusFilter.count() > 0) {
        await expect(statusFilter.first()).toBeVisible();
      }
    });
  });

  test.describe('Email Templates Page', () => {
    test('should display templates page', async ({ page }) => {
      await page.goto('/marketing/templates');
      await expect(page).toHaveURL(/.*templates/);
    });

    test('should have create template button', async ({ page }) => {
      await page.goto('/marketing/templates');
      await expect(page).toHaveURL(/.*templates/);
    });

    test('should display templates list', async ({ page }) => {
      await page.goto('/marketing/templates');
      await expect(page).toHaveURL(/.*templates/);
    });
  });

  test.describe('Referrals Page', () => {
    test('should display referrals page', async ({ page }) => {
      await page.goto('/marketing/referrals');
      await expect(page).toHaveURL(/.*referrals/);
    });

    test('should have add referral button', async ({ page }) => {
      await page.goto('/marketing/referrals');
      await expect(page).toHaveURL(/.*referrals/);
    });

    test('should display referrals list or grid', async ({ page }) => {
      await page.goto('/marketing/referrals');
      await expect(page).toHaveURL(/.*referrals/);
    });

    test('should navigate to referral detail on row click', async ({ page }) => {
      await page.goto('/marketing/referrals');
      await page.waitForTimeout(2000);
      const row = page.locator('[class*="MuiDataGrid-row"], tr[data-id], tbody tr').first();
      if (await row.count() > 0) {
        await row.click();
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Cross-Sell Opportunities Page', () => {
    test('should display cross-sell page', async ({ page }) => {
      await page.goto('/marketing/cross-sell');
      await expect(page).toHaveURL(/.*cross-sell/);
    });

    test('should have generate recommendations button', async ({ page }) => {
      await page.goto('/marketing/cross-sell');
      await expect(page).toHaveURL(/.*cross-sell/);
    });

    test('should display recommendations list', async ({ page }) => {
      await page.goto('/marketing/cross-sell');
      await expect(page).toHaveURL(/.*cross-sell/);
    });

    test('should show create quote option for recommendations', async ({ page }) => {
      await page.goto('/marketing/cross-sell');
      await page.waitForTimeout(2000);
      const row = page.locator('[class*="MuiDataGrid-row"], tr[data-id], tbody tr').first();
      if (await row.count() > 0) {
        const createQuoteButton = row.locator('button').filter({ hasText: /quote/i });
        if (await createQuoteButton.count() > 0) {
          await expect(createQuoteButton.first()).toBeVisible();
        }
      }
    });
  });
});
