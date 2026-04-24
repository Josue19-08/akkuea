import { Elysia } from 'elysia';
import { z, ZodSchema, ZodError } from 'zod';

/**
 * Format Zod errors into a structured response
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }

  return formatted;
}

/**
 * Create validation error response
 */
function createValidationError(
  errors: Record<string, string[]>,
  source: 'body' | 'query' | 'params',
) {
  return {
    status: 400,
    code: 'VALIDATION_ERROR',
    message: `Invalid ${source} parameters`,
    details: {
      source,
      errors,
    },
  };
}

/**
 * Body validation plugin
 */
export function validateBody<T extends ZodSchema>(schema: T) {
  return new Elysia({ name: 'validate-body' })
    .onBeforeHandle({ as: 'scoped' }, ({ body, set }) => {
      const result = schema.safeParse(body);
      if (!result.success) {
        set.status = 400;
        return createValidationError(formatZodErrors(result.error), 'body');
      }
    });
}

/**
 * Query validation plugin
 */
export function validateQuery<T extends ZodSchema>(schema: T) {
  return new Elysia({ name: 'validate-query' })
    .onBeforeHandle({ as: 'scoped' }, ({ query, set }) => {
      const result = schema.safeParse(query);
      if (!result.success) {
        set.status = 400;
        return createValidationError(formatZodErrors(result.error), 'query');
      }
    });
}

/**
 * Path params validation plugin
 */
export function validateParams<T extends ZodSchema>(schema: T) {
  return new Elysia({ name: 'validate-params' })
    .onBeforeHandle({ as: 'scoped' }, ({ params, set }) => {
      const result = schema.safeParse(params);
      if (!result.success) {
        set.status = 400;
        return createValidationError(formatZodErrors(result.error), 'params');
      }
    });
}

/**
 * Combined validation plugin for body, query, and params
 */
export function validate<
  TBody extends ZodSchema | undefined = undefined,
  TQuery extends ZodSchema | undefined = undefined,
  TParams extends ZodSchema | undefined = undefined,
>(options: { body?: TBody; query?: TQuery; params?: TParams }) {
  return new Elysia({ name: 'validate' })
    .onBeforeHandle({ as: 'scoped' }, ({ body, query, params, set }) => {
      // Validate body
      if (options.body) {
        const bodyResult = options.body.safeParse(body);
        if (!bodyResult.success) {
          set.status = 400;
          return createValidationError(formatZodErrors(bodyResult.error), 'body');
        }
      }

      // Validate query
      if (options.query) {
        const queryResult = options.query.safeParse(query);
        if (!queryResult.success) {
          set.status = 400;
          return createValidationError(formatZodErrors(queryResult.error), 'query');
        }
      }

      // Validate params
      if (options.params) {
        const paramsResult = options.params.safeParse(params);
        if (!paramsResult.success) {
          set.status = 400;
          return createValidationError(formatZodErrors(paramsResult.error), 'params');
        }
      }
    });
}

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid UUID format'),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Schema for property shares owner param validation
 */
export const ownerParamSchema = z.object({
  id: z.string().uuid('Invalid UUID format'),
  owner: z.string().min(1, 'Owner address is required'),
});
