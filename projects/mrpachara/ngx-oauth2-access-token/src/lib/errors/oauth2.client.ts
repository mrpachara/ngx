import { Oauth2ErrorResponse } from '@mrpachara/ngx-oauth2-access-token/standard';

export class Oauth2ClientResponseError extends Error {
  constructor(
    readonly error: Required<Oauth2ErrorResponse>,
    override readonly cause: unknown,
  ) {
    super(error.error_description, { cause });
    this.name = error.error;
  }
}
