import { StateData } from '../types';

export interface CallbackErrorCause {
  error: string;
  error_description?: string;
  stateData?: StateData;
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
  constructor(message = 'Bad request to callback.', stateData?: StateData) {
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
