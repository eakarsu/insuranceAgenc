export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'InsureFlow API',
    version: '1.0.0',
    description: 'Insurance Agency Management Platform API',
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Development' },
  ],
  components: {
    securitySchemes: {
      session: {
        type: 'apiKey',
        in: 'cookie',
        name: 'next-auth.session-token',
        description: 'NextAuth session cookie',
      },
    },
  },
  security: [{ session: [] }],
  paths: {
    '/api/claims': {
      get: {
        tags: ['Claims'],
        summary: 'List claims',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Paginated list of claims' } },
      },
      post: {
        tags: ['Claims'],
        summary: 'Create a claim (auto-triggers AI analysis)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['clientId', 'policyId', 'type', 'description'],
                properties: {
                  clientId: { type: 'string' },
                  policyId: { type: 'string' },
                  type: { type: 'string' },
                  dateOfLoss: { type: 'string', format: 'date' },
                  description: { type: 'string' },
                  lossLocation: { type: 'string' },
                  estimatedLoss: { type: 'number' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Created claim' } },
      },
    },
    '/api/claims/{id}': {
      get: {
        tags: ['Claims'],
        summary: 'Get claim details (includes AI fields)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Claim with AI analysis data' } },
      },
      put: { tags: ['Claims'], summary: 'Update claim', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Updated claim' } } },
      patch: { tags: ['Claims'], summary: 'Partial update claim', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Updated claim' } } },
      delete: { tags: ['Claims'], summary: 'Delete claim', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Success' } } },
    },
    '/api/claims/{id}/ai-analysis': {
      get: {
        tags: ['AI Analysis'],
        summary: 'Get stored AI analysis for a claim',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'AI analysis data' } },
      },
      post: {
        tags: ['AI Analysis'],
        summary: 'Trigger AI analysis + fraud detection for a claim',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Analysis and fraud detection results' } },
      },
    },
    '/api/reports/dashboard': {
      get: {
        tags: ['Reports'],
        summary: 'Enhanced dashboard metrics with AI stats',
        responses: { 200: { description: 'Dashboard metrics including high-risk claims count' } },
      },
    },
    '/api/reports/performance': {
      get: {
        tags: ['Reports'],
        summary: 'Agent performance metrics',
        responses: { 200: { description: 'Agent performance data' } },
      },
    },
    '/api/reports/export': {
      get: {
        tags: ['Reports'],
        summary: 'Export claims data as CSV or JSON',
        parameters: [
          { name: 'format', in: 'query', schema: { type: 'string', enum: ['csv', 'json'], default: 'json' } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: { 200: { description: 'Exported data' } },
      },
    },
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Basic health check (public)',
        security: [],
        responses: {
          200: { description: 'All services healthy' },
          503: { description: 'One or more services unhealthy' },
        },
      },
    },
    '/api/health/detailed': {
      get: {
        tags: ['Health'],
        summary: 'Detailed health check (admin only)',
        responses: { 200: { description: 'Detailed system information' } },
      },
    },
    '/api/dashboard/stats': {
      get: {
        tags: ['Dashboard'],
        summary: 'Dashboard statistics including AI metrics',
        responses: { 200: { description: 'Dashboard stats with aiMetrics' } },
      },
    },
  },
};
