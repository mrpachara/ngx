import { Oauth2ErrorResponse } from '../types';

export interface CallbackErrorCause extends Oauth2ErrorResponse {
  readonly stateData?: unknown;
}

export class CallbackError extends Error {
  override readonly cause!: CallbackErrorCause;

  constructor(errorObject: CallbackErrorCause) {
    super(errorObject.error_description ?? errorObject.error, {
      cause: errorObject,
    });
    this.name = errorObject.error;
  }
}

export class BadResponseCallbackError extends CallbackError {
  constructor(message = 'Bad request to callback.', stateData?: unknown) {
    super({
      error: 'BadResponseCallbackError',
      error_description: message,
      ...(stateData ? { stateData } : {}),
    });
  }
}

export class ErrorResponseCallbackError extends CallbackError {
  constructor(errorObject: CallbackErrorCause) {
    super(errorObject);
  }
}
