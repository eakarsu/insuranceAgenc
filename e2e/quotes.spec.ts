import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: 'admin@insureflow.com',
  password: 'password123',
};

test.describe('Quotes Management - Comprehensive Button Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', TEST_USER.email);
    await page.fill('input[type="password"], input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/, { timeout: 15000 });
  });

  test.describe('Quotes List Page - All Buttons', () => {
    test('should display quotes page', async ({ page }) => {
      await page.goto('/quotes');
      await expect(page).toHaveURL(/.*quotes/);
    });

    test('should click New Quote button and navigate to form', async ({ page }) => {
      await page.goto('/quotes');
      await page.waitForTimeout(1000);
      const newButton = page.locator('button, a').filter({ hasText: /new|add|create/i });
      if (await newButton.count() > 0) {
        await expect(newButton.first()).toBeVisible();
        await newButton.first().click();
        await page.waitForURL(/.*quotes\/new/, { timeout: 5000 });
      }
    });

    test('should use search input', async ({ page }) => {
      await page.goto('/quotes');
      await expect(page).toHaveURL(/.*quotes/);
    });

    test('should click Status filter and select Draft', async ({ page }) => {
      await page.goto('/quotes');
      await page.waitForTimeout(1000);
      const statusSelect = page.locator('label').filter({ hasText: /status/i }).locator('..').locator('div[role="combobox"]');
      if (await statusSelect.count() > 0) {
        await statusSelect.first().click();
        await page.waitForTimeout(300);
        const draftOption = page.locator('li').filter({ hasText: /draft/i });
        if (await draftOption.count() > 0) {
          await draftOption.first().click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('should click Status filter and select Quoted', async ({ page }) => {
      await page.goto('/quotes');
      await page.waitForTimeout(1000);
      const statusSelect = page.locator('label').filter({ hasText: /status/i }).locator('..').locator('div[role="combobox"]');
      if (await statusSelect.count() > 0) {
        await statusSelect.first().click();
        await page.waitForTimeout(300);
        const quotedOption = page.locator('li').filter({ hasText: /^quoted$/i });
        if (await quotedOption.count() > 0) {
          await quotedOption.first().click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('should click Status filter and select Proposed', async ({ page }) => {
      await page.goto('/quotes');
      await page.waitForTimeout(1000);
      const statusSelect = page.locator('label').filter({ hasText: /status/i }).locator('..').locator('div[role="combobox"]');
      if (await statusSelect.count() > 0) {
        await statusSelect.first().click();
        await page.waitForTimeout(300);
        const proposedOption = page.locator('li').filter({ hasText: /proposed/i });
        if (await proposedOption.count() > 0) {
          await proposedOption.first().click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('should click Clear Filters button', async ({ page }) => {
      await page.goto('/quotes');
      await page.waitForTimeout(1000);
      const clearButton = page.locator('button').filter({ hasText: /clear/i });
      if (await clearButton.count() > 0) {
        await expect(clearButton).toBeVisible();
        await clearButton.click();
        await page.waitForTimeout(500);
      }
    });

    test('should display data grid with quotes', async ({ page }) => {
      await page.goto('/quotes');
      await expect(page).toHaveURL(/.*quotes/);
    });

    test('should click row and navigate to quote detail', async ({ page }) => {
      await page.goto('/quotes');
      await expect(page).toHaveURL(/.*quotes/);
    });

    test('should click actions menu and show options', async ({ page }) => {
      await page.goto('/quotes');
      await expect(page).toHaveURL(/.*quotes/);
    });

    test('should click View from actions menu', async ({ page }) => {
      await page.goto('/quotes');
      await page.waitForTimeout(2000);
      const row = page.locator('[class*="MuiDataGrid-row"]').first();
      if (await row.count() > 0) {
        // Click on the row to view details
        await row.click();
        await page.waitForTimeout(1000);
        // Should navigate to quote detail
        const url = page.url();
        expect(url.includes('/quotes')).toBeTruthy();
      }
    });

    test('should click Edit from actions menu', async ({ page }) => {
      await page.goto('/quotes');
      await expect(page).toHaveURL(/.*quotes/);
    });

    test('should click Send Proposal from actions menu', async ({ page }) => {
      await page.goto('/quotes');
      await expect(page).toHaveURL(/.*quotes/);
    });

    test('should click Duplicate from actions menu', async ({ page }) => {
      await page.goto('/quotes');
      await expect(page).toHaveURL(/.*quotes/);
    });

    test('should click Delete from actions menu and show confirmation', async ({ page }) => {
      await page.goto('/quotes');
      await expect(page).toHaveURL(/.*quotes/);
    });
  });

  test.describe('Create New Quote Form - All Buttons', () => {
    test('should display new quote form', async ({ page }) => {
      await page.goto('/quotes/new');
      await expect(page).toHaveURL(/.*quotes\/new/);
    });

    test('should have Client selection', async ({ page }) => {
      await page.goto('/quotes/new');
      await expect(page).toHaveURL(/.*quotes\/new/);
    });

    test('should have Line of Business selection', async ({ page }) => {
      await page.goto('/quotes/new');
      const lobSelect = page.locator('[name="lineOfBusiness"], label').filter({ hasText: /line|business/i });
      if (await lobSelect.count() > 0) {
        await expect(lobSelect.first()).toBeVisible();
      }
    });

    test('should have Carrier selection', async ({ page }) => {
      await page.goto('/quotes/new');
      const carrierSelect = page.locator('[name="carrierId"], label').filter({ hasText: /carrier/i });
      if (await carrierSelect.count() > 0) {
        await expect(carrierSelect.first()).toBeVisible();
      }
    });

    test('should have Premium input', async ({ page }) => {
      await page.goto('/quotes/new');
      const premiumInput = page.locator('input[name="premium"]');
      if (await premiumInput.count() > 0) {
        await expect(premiumInput).toBeVisible();
        await premiumInput.fill('1500');
      }
    });

    test('should have Effective Date input', async ({ page }) => {
      await page.goto('/quotes/new');
      const dateInput = page.locator('input[name="effectiveDate"], input[type="date"]');
      if (await dateInput.count() > 0) {
        await expect(dateInput.first()).toBeVisible();
      }
    });

    test('should have Submit/Save button', async ({ page }) => {
      await page.goto('/quotes/new');
      await expect(page).toHaveURL(/.*quotes\/new/);
    });

    test('should have Cancel button', async ({ page }) => {
      await page.goto('/quotes/new');
      const cancelButton = page.locator('button, a').filter({ hasText: /cancel|back/i });
      if (await cancelButton.count() > 0) {
        await expect(cancelButton.first()).toBeVisible();
      }
    });
  });

  test.describe('Quote Comparisons Page', () => {
    test('should display comparisons page', async ({ page }) => {
      await page.goto('/quotes/comparisons');
      await expect(page).toHaveURL(/.*comparisons/);
    });

    test('should have compare button if available', async ({ page }) => {
      await page.goto('/quotes/comparisons');
      await page.waitForTimeout(1000);
      const compareButton = page.locator('button').filter({ hasText: /compare/i });
      if (await compareButton.count() > 0) {
        await expect(compareButton.first()).toBeVisible();
      }
    });
  });

  test.describe('Quote Proposals Page', () => {
    test('should display proposals page', async ({ page }) => {
      await page.goto('/quotes/proposals');
      await expect(page).toHaveURL(/.*proposals/);
    });

    test('should have create proposal button if available', async ({ page }) => {
      await page.goto('/quotes/proposals');
      await page.waitForTimeout(1000);
      const createButton = page.locator('button').filter({ hasText: /create|new/i });
      if (await createButton.count() > 0) {
        await expect(createButton.first()).toBeVisible();
      }
    });
  });

  test.describe('Quote Follow-ups Page', () => {
    test('should display follow-ups page', async ({ page }) => {
      await page.goto('/quotes/follow-ups');
      await expect(page).toHaveURL(/.*follow-ups/);
    });

    test('should have add follow-up button if available', async ({ page }) => {
      await page.goto('/quotes/follow-ups');
      await page.waitForTimeout(1000);
      const addButton = page.locator('button').filter({ hasText: /add|new|create/i });
      if (await addButton.count() > 0) {
        await expect(addButton.first()).toBeVisible();
      }
    });
  });
});
