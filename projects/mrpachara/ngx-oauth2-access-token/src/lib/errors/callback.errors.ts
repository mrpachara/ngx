export class BadResponseCallbackError extends Error {
  constructor(message = 'Bad request to callback.', options?: ErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

export class ErrorResponseCallbackError extends Error {
  constructor(errorObject: { error: string; error_description?: string }) {
    super(errorObject.error_description ?? errorObject.error, {
      cause: errorObject,
    });
    this.name = errorObject.error ?? this.constructor.name;
  }
}
