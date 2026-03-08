export class Oauth2ClientResponseError extends Error {
  constructor(
    readonly error: {
      readonly error: string;
      readonly error_description: string;
    },
    override readonly cause: unknown,
  ) {
    super(error.error_description, { cause });
    this.name = error.error;
  }
}
