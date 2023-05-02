export class BadResponseCallbackError extends Error {
  constructor(message = 'Bad request to callback.', options?: ErrorOptions) {
    super(message, options);

    if (typeof this.stack === 'undefined') {
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, BadResponseCallbackError);
      } else {
        this.stack = new Error().stack;
      }
    }

    this.name = this.constructor.name;
  }
}

export class ErrorResponseCallbackError extends Error {
  constructor(errorObject: { error?: string; error_description?: string }) {
    super(errorObject.error_description ?? errorObject.error, {
      cause: errorObject,
    });

    if (typeof this.stack === 'undefined') {
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ErrorResponseCallbackError);
      } else {
        this.stack = new Error().stack;
      }
    }

    this.name = this.constructor.name;
  }
}
