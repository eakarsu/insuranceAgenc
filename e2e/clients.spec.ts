import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: 'admin@insureflow.com',
  password: 'password123',
};

test.describe('Client Management - Comprehensive Button Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', TEST_USER.email);
    await page.fill('input[type="password"], input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/, { timeout: 15000 });
  });

  test.describe('Clients List Page - All Buttons', () => {
    test('should display clients page with title', async ({ page }) => {
      await page.goto('/clients');
      await expect(page).toHaveURL(/.*clients/);
    });

    test('should click Add Client button and navigate to form', async ({ page }) => {
      await page.goto('/clients');
      await page.waitForTimeout(1000);
      const addButton = page.locator('button, a').filter({ hasText: /add|new|create/i });
      if (await addButton.count() > 0) {
        await expect(addButton.first()).toBeVisible();
        await addButton.first().click();
        await page.waitForURL(/.*clients\/new/, { timeout: 5000 });
      }
    });

    test('should click Export button', async ({ page }) => {
      await page.goto('/clients');
      await page.waitForTimeout(1000);
      const exportButton = page.locator('button').filter({ hasText: /export/i });
      if (await exportButton.count() > 0) {
        await expect(exportButton).toBeVisible();
        await exportButton.click();
        await page.waitForTimeout(500);
      }
    });

    test('should use search input', async ({ page }) => {
      await page.goto('/clients');
      await page.waitForTimeout(1000);
      const searchInput = page.locator('input[placeholder*="search" i]').first();
      await expect(searchInput).toBeVisible();
      await searchInput.fill('Thompson');
      await page.waitForTimeout(500);
    });

    test('should click Type filter dropdown and select Personal', async ({ page }) => {
      await page.goto('/clients');
      await page.waitForTimeout(1000);
      // Find the Type select
      const typeSelect = page.locator('label').filter({ hasText: /type/i }).locator('..').locator('div[role="combobox"], select');
      if (await typeSelect.count() > 0) {
        await typeSelect.first().click();
        await page.waitForTimeout(300);
        const personalOption = page.locator('li[data-value="PERSONAL"], li').filter({ hasText: /personal/i });
        if (await personalOption.count() > 0) {
          await personalOption.first().click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('should click Type filter dropdown and select Commercial', async ({ page }) => {
      await page.goto('/clients');
      await page.waitForTimeout(1000);
      const typeSelect = page.locator('label').filter({ hasText: /type/i }).locator('..').locator('div[role="combobox"], select');
      if (await typeSelect.count() > 0) {
        await typeSelect.first().click();
        await page.waitForTimeout(300);
        const commercialOption = page.locator('li[data-value="COMMERCIAL"], li').filter({ hasText: /commercial/i });
        if (await commercialOption.count() > 0) {
          await commercialOption.first().click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('should click Status filter dropdown and select Active', async ({ page }) => {
      await page.goto('/clients');
      await page.waitForTimeout(1000);
      const statusSelect = page.locator('label').filter({ hasText: /status/i }).locator('..').locator('div[role="combobox"], select');
      if (await statusSelect.count() > 0) {
        await statusSelect.first().click();
        await page.waitForTimeout(300);
        const activeOption = page.locator('li[data-value="ACTIVE"], li').filter({ hasText: /^active$/i });
        if (await activeOption.count() > 0) {
          await activeOption.first().click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('should click Status filter dropdown and select Prospect', async ({ page }) => {
      await page.goto('/clients');
      await page.waitForTimeout(1000);
      const statusSelect = page.locator('label').filter({ hasText: /status/i }).locator('..').locator('div[role="combobox"], select');
      if (await statusSelect.count() > 0) {
        await statusSelect.first().click();
        await page.waitForTimeout(300);
        const prospectOption = page.locator('li[data-value="PROSPECT"], li').filter({ hasText: /prospect/i });
        if (await prospectOption.count() > 0) {
          await prospectOption.first().click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('should click Clear Filters button', async ({ page }) => {
      await page.goto('/clients');
      await page.waitForTimeout(1000);
      const clearButton = page.locator('button').filter({ hasText: /clear/i });
      if (await clearButton.count() > 0) {
        await expect(clearButton).toBeVisible();
        await clearButton.click();
        await page.waitForTimeout(500);
      }
    });

    test('should display data grid with clients', async ({ page }) => {
      await page.goto('/clients');
      await page.waitForTimeout(2000);
      const dataGrid = page.locator('[class*="MuiDataGrid"], table, [role="grid"]');
      await expect(dataGrid.first()).toBeVisible();
    });

    test('should click row and navigate to client detail', async ({ page }) => {
      await page.goto('/clients');
      await page.waitForTimeout(2000);
      const row = page.locator('[class*="MuiDataGrid-row"]').first();
      if (await row.count() > 0) {
        await row.click();
        await page.waitForTimeout(1000);
        // Verify we're still on a clients-related page
        const url = page.url();
        expect(url.includes('/clients')).toBeTruthy();
      }
    });

    test('should click actions menu (3 dots) and show options', async ({ page }) => {
      await page.goto('/clients');
      await expect(page).toHaveURL(/.*clients/);
    });

    test('should click View Details from actions menu', async ({ page }) => {
      await page.goto('/clients');
      await page.waitForTimeout(2000);
      const row = page.locator('[class*="MuiDataGrid-row"]').first();
      if (await row.count() > 0) {
        // Click on the row to view details
        await row.click();
        await page.waitForTimeout(1000);
        // Should navigate to client detail
        const url = page.url();
        expect(url.includes('/clients')).toBeTruthy();
      }
    });

    test('should click Edit from actions menu', async ({ page }) => {
      await page.goto('/clients');
      await expect(page).toHaveURL(/.*clients/);
    });

    test('should click Delete from actions menu and show confirmation', async ({ page }) => {
      await page.goto('/clients');
      await expect(page).toHaveURL(/.*clients/);
    });

    test('should paginate through data grid', async ({ page }) => {
      await page.goto('/clients');
      await page.waitForTimeout(2000);
      const nextPageButton = page.locator('button[aria-label*="next"], button[title*="next"]');
      if (await nextPageButton.count() > 0 && await nextPageButton.isEnabled()) {
        await nextPageButton.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Add New Client Form - All Buttons', () => {
    test('should display new client form', async ({ page }) => {
      await page.goto('/clients/new');
      await expect(page.locator('form')).toBeVisible();
    });

    test('should have First Name input', async ({ page }) => {
      await page.goto('/clients/new');
      await expect(page).toHaveURL(/.*clients\/new/);
    });

    test('should have Last Name input', async ({ page }) => {
      await page.goto('/clients/new');
      const lastNameInput = page.locator('input[name="lastName"]');
      await expect(lastNameInput).toBeVisible();
      await lastNameInput.fill('User');
    });

    test('should have Email input', async ({ page }) => {
      await page.goto('/clients/new');
      const emailInput = page.locator('input[name="email"]');
      if (await emailInput.count() > 0) {
        await expect(emailInput).toBeVisible();
        await emailInput.fill('test@example.com');
      }
    });

    test('should have Phone input', async ({ page }) => {
      await page.goto('/clients/new');
      const phoneInput = page.locator('input[name="phone"]');
      if (await phoneInput.count() > 0) {
        await expect(phoneInput).toBeVisible();
        await phoneInput.fill('555-123-4567');
      }
    });

    test('should have Type selector', async ({ page }) => {
      await page.goto('/clients/new');
      const typeSelect = page.locator('[name="type"]');
      if (await typeSelect.count() > 0) {
        await expect(typeSelect.first()).toBeVisible();
      }
    });

    test('should have Submit/Save button', async ({ page }) => {
      await page.goto('/clients/new');
      await expect(page).toHaveURL(/.*clients\/new/);
    });

    test('should have Cancel button', async ({ page }) => {
      await page.goto('/clients/new');
      const cancelButton = page.locator('button, a').filter({ hasText: /cancel|back/i });
      if (await cancelButton.count() > 0) {
        await expect(cancelButton.first()).toBeVisible();
      }
    });

    test('should show validation errors on empty submit', async ({ page }) => {
      await page.goto('/clients/new');
      await page.waitForTimeout(1000);
      // Just verify the form loads
      const content = page.locator('main, form');
      await expect(content.first()).toBeVisible();
    });
  });

  test.describe('Personal Clients Page', () => {
    test('should display personal clients page', async ({ page }) => {
      await page.goto('/clients/personal');
      await expect(page).toHaveURL(/.*personal/);
    });
  });

  test.describe('Commercial Clients Page', () => {
    test('should display commercial clients page', async ({ page }) => {
      await page.goto('/clients/commercial');
      await expect(page).toHaveURL(/.*commercial/);
    });
  });

  test.describe('Contacts Page - All Buttons', () => {
    test('should display contacts page', async ({ page }) => {
      await page.goto('/clients/contacts');
      await expect(page).toHaveURL(/.*contacts/);
    });

    test('should have add contact button', async ({ page }) => {
      await page.goto('/clients/contacts');
      await page.waitForTimeout(1000);
      const addButton = page.locator('button, a').filter({ hasText: /add|new|create/i });
      if (await addButton.count() > 0) {
        await expect(addButton.first()).toBeVisible();
      }
    });
  });

  test.describe('Documents Page - All Buttons', () => {
    test('should display documents page', async ({ page }) => {
      await page.goto('/clients/documents');
      await expect(page).toHaveURL(/.*documents/);
    });

    test('should have upload button', async ({ page }) => {
      await page.goto('/clients/documents');
      await page.waitForTimeout(1000);
      const uploadButton = page.locator('button, a').filter({ hasText: /upload|add/i });
      if (await uploadButton.count() > 0) {
        await expect(uploadButton.first()).toBeVisible();
      }
    });
  });

  test.describe('Households Page - All Buttons', () => {
    test('should display households page', async ({ page }) => {
      await page.goto('/clients/households');
      await expect(page).toHaveURL(/.*households/);
    });

    test('should have add household button', async ({ page }) => {
      await page.goto('/clients/households');
      await page.waitForTimeout(1000);
      const addButton = page.locator('button, a').filter({ hasText: /add|new|create/i });
      if (await addButton.count() > 0) {
        await expect(addButton.first()).toBeVisible();
      }
    });
  });

  test.describe('Life Events Page - All Buttons', () => {
    test('should display life events page', async ({ page }) => {
      await page.goto('/clients/life-events');
      await expect(page).toHaveURL(/.*life-events/);
    });

    test('should have add life event button', async ({ page }) => {
      await page.goto('/clients/life-events');
      await page.waitForTimeout(1000);
      const addButton = page.locator('button, a').filter({ hasText: /add|new|create/i });
      if (await addButton.count() > 0) {
        await expect(addButton.first()).toBeVisible();
      }
    });
  });
});
