import { IdentifiableConfig } from './commons';

/** Access token configuration */
export interface AccessTokenConfig<
  N extends string = string,
> extends IdentifiableConfig<N> {
  /** OAuth client ID, it is REQUIRED. */
  readonly clientId: string;

  /** OAuth client secret if needed, it is an OPTIONAL. */
  readonly clientSecret?: string;

  /** The URL of access token end point, it is REQUIRED. */
  readonly accessTokenUrl: string;

  /**
   * By default, the client credentials is sent by using HTTP header
   * `Authorization`. If this property is `true`, the client credentials will be
   * sent by using body content.
   */
  readonly clientCredentialsInParams?: boolean;

  /**
   * By usually, the _life-time_ of the access token will be provided by
   * `expires_in` claim. But if it is not provided, use this TTL instead.
   */
  readonly accessTokenTtl?: number;

  /** The _life-time_ of refresh token. */
  readonly refreshTokenTtl?: number;
}
