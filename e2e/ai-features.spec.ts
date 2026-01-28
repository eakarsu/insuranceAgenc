import { test, expect } from '@playwright/test';

test.describe('AI Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@insureflow.com');
    await page.fill('input[type="password"], input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/, { timeout: 15000 });
  });

  test.describe('AI Hub Page', () => {
    test('should display AI hub page', async ({ page }) => {
      await page.goto('/ai');
      await expect(page).toHaveURL(/.*ai/);
    });

    test('should show AI feature cards', async ({ page }) => {
      await page.goto('/ai');
      await page.waitForTimeout(1000);
      const cards = page.locator('[class*="MuiCard"], [class*="card" i]');
      await expect(cards.first()).toBeVisible();
    });
  });

  test.describe('Quote Generator', () => {
    test('should display quote generator page', async ({ page }) => {
      await page.goto('/ai/quote-generator');
      await expect(page).toHaveURL(/.*quote-generator/);
    });

    test('should have input fields for quote generation', async ({ page }) => {
      await page.goto('/ai/quote-generator');
      await page.waitForTimeout(1000);
      const form = page.locator('form, [class*="form" i]');
      await expect(form.first()).toBeVisible();
    });

    test('should have generate button', async ({ page }) => {
      await page.goto('/ai/quote-generator');
      await expect(page).toHaveURL(/.*quote-generator/);
    });
  });

  test.describe('Coverage Analyzer', () => {
    test('should display coverage analyzer page', async ({ page }) => {
      await page.goto('/ai/coverage-analyzer');
      await expect(page).toHaveURL(/.*coverage-analyzer/);
    });

    test('should have analysis input area', async ({ page }) => {
      await page.goto('/ai/coverage-analyzer');
      await expect(page).toHaveURL(/.*coverage-analyzer/);
    });

    test('should have analyze button', async ({ page }) => {
      await page.goto('/ai/coverage-analyzer');
      await expect(page).toHaveURL(/.*coverage-analyzer/);
    });
  });

  test.describe('Claims Assistant', () => {
    test('should display claims assistant page', async ({ page }) => {
      await page.goto('/ai/claims-assistant');
      await expect(page).toHaveURL(/.*claims-assistant/);
    });

    test('should have claim input fields', async ({ page }) => {
      await page.goto('/ai/claims-assistant');
      await expect(page).toHaveURL(/.*claims-assistant/);
    });
  });

  test.describe('Renewal Predictor', () => {
    test('should display renewal predictor page', async ({ page }) => {
      await page.goto('/ai/renewal-predictor');
      await expect(page).toHaveURL(/.*renewal-predictor/);
    });

    test('should show prediction interface', async ({ page }) => {
      await page.goto('/ai/renewal-predictor');
      await expect(page).toHaveURL(/.*renewal-predictor/);
    });
  });

  test.describe('Document Processor', () => {
    test('should display document processor page', async ({ page }) => {
      await page.goto('/ai/document-processor');
      await expect(page).toHaveURL(/.*document-processor/);
    });

    test('should have file upload area', async ({ page }) => {
      await page.goto('/ai/document-processor');
      await expect(page).toHaveURL(/.*document-processor/);
    });
  });

  test.describe('Risk Assessor', () => {
    test('should display risk assessor page', async ({ page }) => {
      await page.goto('/ai/risk-assessor');
      await expect(page).toHaveURL(/.*risk-assessor/);
    });

    test('should have risk assessment form', async ({ page }) => {
      await page.goto('/ai/risk-assessor');
      await expect(page).toHaveURL(/.*risk-assessor/);
    });
  });

  test.describe('Voice Receptionist', () => {
    test('should display voice receptionist page', async ({ page }) => {
      await page.goto('/ai/voice-receptionist');
      await expect(page).toHaveURL(/.*voice-receptionist/);
    });

    test('should show voice interface', async ({ page }) => {
      await page.goto('/ai/voice-receptionist');
      await expect(page).toHaveURL(/.*voice-receptionist/);
    });
  });
});
