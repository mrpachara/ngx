export class Oauth2ClientResponseError extends Error {
  constructor(
    name: string,
    errorObject: {
      error: string;
      error_description: string;
    },
    options?: ErrorOptions,
  ) {
    super(errorObject.error_description, options);
    this.name = `client ${name}: ${errorObject.error}`;
  }
}
