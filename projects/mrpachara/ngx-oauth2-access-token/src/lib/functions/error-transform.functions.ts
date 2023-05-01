import { ErrorDescription } from '../types';

export function isErrorDescription(obj: any): obj is ErrorDescription {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'error' in obj &&
    typeof obj['error'] === 'string' &&
    'description' in obj &&
    typeof obj['description'] === 'string'
  );
}

export function isOauthError(
  obj: any,
): obj is { error: string; error_description: string } {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'error' in obj &&
    typeof obj['error'] === 'string' &&
    'error_description' in obj &&
    typeof obj['error_description'] === 'string'
  );
}

export function isApiError(
  obj: any,
): obj is { statusCode: number; error: { type: string; description: string } } {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'statusCode' in obj &&
    'error' in obj &&
    'type' in obj['error'] &&
    typeof obj['error']['type'] === 'string' &&
    'description' in obj['error'] &&
    typeof obj['error']['description'] === 'string'
  );
}

export function transformKnownError(err: unknown): ErrorDescription | null {
  if (isErrorDescription(err)) {
    return err;
  } else if (isOauthError(err)) {
    return {
      error: err.error,
      description: err.error_description,
    };
  } else if (isApiError(err)) {
    return {
      error: err.error.type,
      description: err.error.description,
    };
  }

  return null;
}

export function transformError(err: unknown): ErrorDescription {
  if (err === null || err === undefined || typeof err === 'boolean') {
    return {
      error: 'unknown_error',
      description: `Unknown error.`,
    };
  }

  let knownError: ErrorDescription | null;

  if ((knownError = transformKnownError(err)) !== null) {
    return knownError;
  }

  if (err instanceof Object && 'error' in err) {
    err = err['error'];

    knownError = transformKnownError(err);

    if (knownError !== null) {
      return knownError;
    }
  }

  if (typeof err === 'string') {
    return {
      error: 'error',
      description: err,
    };
  } else if (typeof err === 'number') {
    return {
      error: 'error',
      description: `${err}`,
    };
  } else if (err instanceof Error) {
    return {
      error: err.name,
      description: err.message,
    };
  }

  return {
    error: 'error',
    description: JSON.stringify(err),
  };
}
