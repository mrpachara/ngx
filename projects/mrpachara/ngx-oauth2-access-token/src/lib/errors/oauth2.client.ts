import { Oauth2ErrorResponse } from '../types';

export class Oauth2ClientResponseError extends Error {
  constructor(
    readonly error: Required<Oauth2ErrorResponse>,
    override readonly cause: unknown,
  ) {
    super(error.error_description, { cause });
    this.name = error.error;
  }
}
