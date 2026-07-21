const errorResponse = { description: 'Typed error', content: { 'application/json': { schema: { type: 'object', properties: { error: { type: 'string' }, code: { type: 'string' }, details: {} } } } } };

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'InsureFlow Governed Claims API',
    version: '2.0.0',
    description: 'Idempotent intake and explicit licensed claim workflow actions. Direct claim mutation and simulated payout are retired.',
  },
  components: {
    securitySchemes: { session: { type: 'apiKey', in: 'cookie', name: 'next-auth.session-token' } },
    parameters: {
      idempotencyKey: { name: 'Idempotency-Key', in: 'header', required: true, schema: { type: 'string', minLength: 8, maxLength: 160 } },
    },
  },
  security: [{ session: [] }],
  paths: {
    '/api/claims': {
      get: { summary: 'List claims', responses: { 200: { description: 'Paginated claim list' }, 401: errorResponse } },
      post: {
        summary: 'Record first notice of loss against an active policy',
        parameters: [{ $ref: '#/components/parameters/idempotencyKey' }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['sourceSystem', 'sourceRecordId', 'clientId', 'policyId', 'type', 'dateOfLoss', 'description', 'jurisdiction'], properties: {
            sourceSystem: { type: 'string' }, sourceRecordId: { type: 'string' }, clientId: { type: 'string' }, policyId: { type: 'string' }, type: { type: 'string' }, dateOfLoss: { type: 'string', format: 'date-time' }, description: { type: 'string', minLength: 20 }, jurisdiction: { type: 'string', minLength: 2, maxLength: 2 }, lossLocation: { type: 'string' }, estimatedLoss: { type: 'number', minimum: 0 },
          } } } },
        },
        responses: { 201: { description: 'Governed claim created' }, 200: { description: 'Exact replay returned existing claim' }, 409: errorResponse, 422: errorResponse },
      },
    },
    '/api/claims/{id}': {
      get: { summary: 'Read claim and complete governed evidence', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Claim case' }, 404: errorResponse } },
      put: { summary: 'Retired unsafe mutation', responses: { 410: errorResponse } },
      patch: { summary: 'Retired unsafe mutation', responses: { 410: errorResponse } },
      delete: { summary: 'Retained claims cannot be deleted', responses: { 405: errorResponse } },
    },
    '/api/claims/{id}/workflow': {
      post: {
        summary: 'Apply one governed claim action',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }, { $ref: '#/components/parameters/idempotencyKey' }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['action', 'expectedVersion'], properties: { action: { type: 'string', enum: ['ASSIGN_ADJUSTER', 'ADD_EVIDENCE', 'SET_RESERVE', 'SUBMIT_FOR_REVIEW', 'ADJUDICATE', 'FILE_APPEAL', 'RESOLVE_APPEAL', 'AUTHORIZE_PAYMENT', 'RECORD_PAYMENT', 'OPEN_SUBROGATION', 'RECORD_RECOVERY', 'CLOSE_CLAIM'] }, expectedVersion: { type: 'integer', minimum: 1 } } } } } },
        responses: { 200: { description: 'Current governed claim' }, 403: errorResponse, 409: errorResponse, 422: errorResponse, 502: errorResponse, 503: errorResponse },
      },
    },
    '/api/health': { get: { security: [], summary: 'Liveness and database check', responses: { 200: { description: 'Healthy' }, 503: { description: 'Unavailable' } } } },
  },
};
