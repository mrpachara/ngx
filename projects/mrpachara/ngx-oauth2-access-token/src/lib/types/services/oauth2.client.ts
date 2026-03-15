/** OAuth 2.0 client credentials */
export interface Oauth2ClientCredentials {
  readonly id: string;
  readonly secret?: string;
}

/** OAuth 2.0 error response transformer function */
// export type Oauth2ClientErrorTransformer = (
//   err: HttpErrorResponse,
// ) => Required<Oauth2ErrorResponse>;
