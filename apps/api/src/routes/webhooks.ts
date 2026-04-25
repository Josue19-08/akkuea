import { Elysia, t } from 'elysia';
import { webhookController } from '../controllers/WebhookController';
import type { WebhookPayload } from '../services/WebhookService';
import { rateLimit } from '../middleware';
import { ApiError } from '../errors/ApiError';

export const webhookRoutes = new Elysia({ prefix: '/webhooks' }).post(
  '/transactions',
  async ({ body, headers, set }) => {
    try {
      return await webhookController.handleTransactionWebhook({
        body: body as WebhookPayload,
        headers,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        set.status = error.statusCode;
        return { success: false, error: error.code, message: error.message };
      }
      set.status = 500;
      return { success: false, error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' };
    }
  },
  {
    body: t.Object({
      transactionHash: t.String({ minLength: 64, maxLength: 64 }),
      status: t.Union([t.Literal('confirmed'), t.Literal('failed')]),
      network: t.Optional(t.String()),
      timestamp: t.Optional(t.String()),
    }),
    beforeHandle: [rateLimit()],
    detail: {
      summary: 'Handle transaction webhooks',
      description: 'Receives notifications from Stellar network and updates transaction status',
      tags: ['Webhooks'],
    },
  },
);
