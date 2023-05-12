export class Oauth2ClientResponseError extends Error {
  constructor(
    errorObject: {
      error: string;
      error_description: string;
    },
    options?: ErrorOptions,
  ) {
    super(errorObject.error_description, options);
    this.name = errorObject.error;
  }
}
