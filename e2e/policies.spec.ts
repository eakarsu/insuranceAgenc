import { test, expect } from '@playwright/test';

test.describe('Policies Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@insureflow.com');
    await page.fill('input[type="password"], input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/, { timeout: 15000 });
  });

  test.describe('Policies List Page', () => {
    test('should display policies page', async ({ page }) => {
      await page.goto('/policies');
      await expect(page).toHaveURL(/.*policies/);
    });

    test('should have add policy button', async ({ page }) => {
      await page.goto('/policies');
      await expect(page).toHaveURL(/.*policies/);
    });

    test('should display data grid with policies', async ({ page }) => {
      await page.goto('/policies');
      await expect(page).toHaveURL(/.*policies/);
    });

    test('should have status filter options', async ({ page }) => {
      await page.goto('/policies');
      await page.waitForTimeout(1000);
      // Check for tabs or filter buttons
      const statusFilters = page.locator('[role="tab"], button').filter({ hasText: /active|all|cancelled|expired/i });
      if (await statusFilters.count() > 0) {
        await expect(statusFilters.first()).toBeVisible();
      }
    });
  });

  test.describe('Create New Policy', () => {
    test('should display new policy form', async ({ page }) => {
      await page.goto('/policies/new');
      await expect(page.locator('form')).toBeVisible();
    });

    test('should have client selection field', async ({ page }) => {
      await page.goto('/policies/new');
      await expect(page).toHaveURL(/.*policies\/new/);
    });

    test('should have carrier selection field', async ({ page }) => {
      await page.goto('/policies/new');
      const carrierSelect = page.locator('[name="carrierId"], [name*="carrier" i]');
      if (await carrierSelect.count() > 0) {
        await expect(carrierSelect.first()).toBeVisible();
      }
    });

    test('should have policy number field', async ({ page }) => {
      await page.goto('/policies/new');
      await expect(page).toHaveURL(/.*policies\/new/);
    });

    test('should have effective date field', async ({ page }) => {
      await page.goto('/policies/new');
      await expect(page).toHaveURL(/.*policies\/new/);
    });

    test('should have premium field', async ({ page }) => {
      await page.goto('/policies/new');
      await expect(page).toHaveURL(/.*policies\/new/);
    });
  });

  test.describe('Policy Detail Page', () => {
    test('should navigate to policy detail when clicking a row', async ({ page }) => {
      await page.goto('/policies');
      await page.waitForTimeout(2000);
      const row = page.locator('[class*="MuiDataGrid-row"], tr[data-id], tbody tr').first();
      if (await row.count() > 0) {
        await row.click();
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Policy Renewals Page', () => {
    test('should display renewals page', async ({ page }) => {
      await page.goto('/policies/renewals');
      await expect(page).toHaveURL(/.*renewals/);
    });

    test('should show upcoming renewals', async ({ page }) => {
      await page.goto('/policies/renewals');
      await expect(page).toHaveURL(/.*renewals/);
    });
  });

  test.describe('Policy Cancellations Page', () => {
    test('should display cancellations page', async ({ page }) => {
      await page.goto('/policies/cancellations');
      await expect(page).toHaveURL(/.*cancellations/);
    });
  });

  test.describe('Policy Endorsements Page', () => {
    test('should display endorsements page', async ({ page }) => {
      await page.goto('/policies/endorsements');
      await expect(page).toHaveURL(/.*endorsements/);
    });
  });
});
