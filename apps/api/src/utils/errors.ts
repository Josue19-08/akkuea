import { isAppError } from '@real-estate-defi/shared';
import { ApiError } from '../errors/ApiError';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400, 'BAD_REQUEST');
    this.name = 'BadRequestError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

export function handleError(error: unknown): ErrorResponse {
  const timestamp = new Date().toISOString();

  if (error instanceof ApiError) {
    return {
      success: false,
      error: error.code,
      message: error.message,
      statusCode: error.statusCode,
      timestamp,
    };
  }

  const err = error as any;
  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    'statusCode' in err &&
    'code' in err
  ) {
    return {
      success: false,
      error: String(err.code),
      message: String(err.message),
      statusCode: Number(err.statusCode),
      timestamp,
    };
  }

  if (isAppError(error)) {
    const err = error as { status?: number; statusCode?: number; code: string; message: string };
    return {
      success: false,
      error: String(err.code),
      message: err.message,
      statusCode: err.status || err.statusCode || 500,
      timestamp,
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: error.message,
      statusCode: 500,
      timestamp,
    };
  }

  return {
    success: false,
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    statusCode: 500,
    timestamp,
  };
}
