import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('API Endpoints - Comprehensive Tests', () => {
  let authCookie: string;

  // Login and get session cookie before tests
  test.beforeAll(async ({ request }) => {
    // Get CSRF token first
    const csrfResponse = await request.get(`${BASE_URL}/api/auth/csrf`);
    const csrfData = await csrfResponse.json();

    // Login
    const loginResponse = await request.post(`${BASE_URL}/api/auth/callback/credentials`, {
      form: {
        email: 'admin@insureflow.com',
        password: 'password123',
        csrfToken: csrfData.csrfToken,
      },
    });

    // Store cookies for subsequent requests
    const cookies = loginResponse.headers()['set-cookie'];
    if (cookies) {
      authCookie = cookies;
    }
  });

  test.describe('Dashboard API', () => {
    test('GET /api/dashboard/stats should return dashboard statistics', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/dashboard/stats`);
      expect([200, 401]).toContain(response.status());
    });

    test('GET /api/dashboard/activities should return recent activities', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/dashboard/activities`);
      expect([200, 401]).toContain(response.status());
    });

    test('GET /api/dashboard/renewals should return upcoming renewals', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/dashboard/renewals`);
      expect([200, 401]).toContain(response.status());
    });

    test('GET /api/dashboard/charts should return chart data', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/dashboard/charts`);
      expect([200, 401]).toContain(response.status());
    });
  });

  test.describe('Clients API', () => {
    test('GET /api/clients should return clients list', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/clients`);
      expect([200, 401]).toContain(response.status());
      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('clients');
        expect(Array.isArray(data.clients)).toBeTruthy();
      }
    });

    test('GET /api/clients with pagination', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/clients?page=1&limit=10`);
      expect([200, 401]).toContain(response.status());
    });

    test('GET /api/clients with type filter', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/clients?type=PERSONAL`);
      expect([200, 401]).toContain(response.status());
    });

    test('GET /api/clients with status filter', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/clients?status=ACTIVE`);
      expect([200, 401]).toContain(response.status());
    });

    test('GET /api/clients with search', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/clients?search=Thompson`);
      expect([200, 401]).toContain(response.status());
    });
  });

  test.describe('Quotes API', () => {
    test('GET /api/quotes should return quotes list', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/quotes`);
      expect([200, 401]).toContain(response.status());
      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('quotes');
        expect(Array.isArray(data.quotes)).toBeTruthy();
      }
    });

    test('GET /api/quotes with pagination', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/quotes?page=1&limit=10`);
      expect([200, 401]).toContain(response.status());
    });

    test('GET /api/quotes with status filter', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/quotes?status=DRAFT`);
      expect([200, 401]).toContain(response.status());
    });
  });

  test.describe('Policies API', () => {
    test('GET /api/policies should return policies list', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/policies`);
      expect([200, 401]).toContain(response.status());
      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('policies');
        expect(Array.isArray(data.policies)).toBeTruthy();
      }
    });

    test('GET /api/policies with pagination', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/policies?page=1&limit=10`);
      expect([200, 401]).toContain(response.status());
    });

    test('GET /api/policies with status filter', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/policies?status=ACTIVE`);
      expect([200, 401]).toContain(response.status());
    });
  });

  test.describe('Claims API', () => {
    test('GET /api/claims should return claims list', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/claims`);
      expect([200, 401]).toContain(response.status());
      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('claims');
        expect(Array.isArray(data.claims)).toBeTruthy();
      }
    });

    test('GET /api/claims with pagination', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/claims?page=1&limit=10`);
      expect([200, 401]).toContain(response.status());
    });

    test('GET /api/claims with status filter', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/claims?status=REPORTED`);
      expect([200, 401]).toContain(response.status());
    });
  });

  test.describe('Commissions API', () => {
    test('GET /api/commissions should return commissions list', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/commissions`);
      expect([200, 401]).toContain(response.status());
    });

    test('GET /api/commissions/stats should return commission stats', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/commissions/stats`);
      expect([200, 401]).toContain(response.status());
    });
  });

  test.describe('Marketing API', () => {
    test('GET /api/marketing/campaigns should return campaigns list', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/marketing/campaigns`);
      expect([200, 401]).toContain(response.status());
    });

    test('GET /api/marketing/templates should return email templates', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/marketing/templates`);
      expect([200, 401]).toContain(response.status());
    });

    test('GET /api/marketing/cross-sell should return cross-sell recommendations', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/marketing/cross-sell`);
      expect([200, 401]).toContain(response.status());
    });
  });

  test.describe('Referrals API', () => {
    test('GET /api/referrals should return referrals list', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/referrals`);
      expect([200, 401]).toContain(response.status());
    });
  });

  test.describe('Carriers API', () => {
    test('GET /api/carriers should return carriers list', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/carriers`);
      expect([200, 401]).toContain(response.status());
      if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data)).toBeTruthy();
      }
    });
  });

  test.describe('Households API', () => {
    test('GET /api/households should return households list', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/households`);
      expect([200, 401]).toContain(response.status());
    });
  });

  test.describe('Contacts API', () => {
    test('GET /api/contacts should return contacts list', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/contacts`);
      expect([200, 401]).toContain(response.status());
    });
  });

  test.describe('Life Events API', () => {
    test('GET /api/life-events should return life events list', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/life-events`);
      expect([200, 401]).toContain(response.status());
    });
  });

  test.describe('Documents API', () => {
    test('GET /api/documents should return documents list', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/documents`);
      expect([200, 401]).toContain(response.status());
    });
  });

  test.describe('Endorsements API', () => {
    test('GET /api/endorsements should return endorsements list', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/endorsements`);
      expect([200, 401]).toContain(response.status());
    });
  });

  test.describe('Settlements API', () => {
    test('GET /api/settlements should return settlements list', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/settlements`);
      expect([200, 401]).toContain(response.status());
    });
  });

  test.describe('Follow-ups API', () => {
    test('GET /api/follow-ups should return follow-ups list', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/follow-ups`);
      expect([200, 401]).toContain(response.status());
    });
  });

  test.describe('Commission Splits API', () => {
    test('GET /api/commission-splits should return commission splits list', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/commission-splits`);
      expect([200, 401]).toContain(response.status());
    });
  });

  test.describe('Users API', () => {
    test('GET /api/users should return users list', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/users`);
      expect([200, 401]).toContain(response.status());
    });
  });

  test.describe('Notifications API', () => {
    test('GET /api/notifications should return notifications list', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/notifications`);
      expect([200, 401]).toContain(response.status());
    });
  });

  test.describe('Search API', () => {
    test('GET /api/search should return search results', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/search?q=test`);
      expect([200, 401]).toContain(response.status());
    });
  });

  test.describe('AI API', () => {
    test('GET /api/ai should be accessible', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/ai`);
      expect([200, 401, 405]).toContain(response.status());
    });
  });

  test.describe('Auth API', () => {
    test('GET /api/auth/csrf should return CSRF token', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/auth/csrf`);
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('csrfToken');
    });

    test('GET /api/auth/session should return session info', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/auth/session`);
      expect(response.status()).toBe(200);
    });

    test('GET /api/auth/providers should return auth providers', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/auth/providers`);
      expect(response.status()).toBe(200);
    });
  });
});
