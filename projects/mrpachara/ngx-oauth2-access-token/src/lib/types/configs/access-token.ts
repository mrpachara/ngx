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
   * By usually, the _time-to-live_ (seconds) of the access token will be
   * provided by `expires_in` claim. But if it is not provided, use this TTL
   * instead. If is omitted, the default TTL from the service will be used.
   */
  readonly accessTokenTtl?: number;

  /**
   * The _time-to-live_ (seconds) of refresh token.
   *
   * - If is `number`, it will be used as the TTL in seconds.
   * - If is `string`, it will be used as the claim name in the response.
   * - If is omitted, the default TTL from the service will be used.
   */
  readonly refreshTokenTtl?: number | string;
}
