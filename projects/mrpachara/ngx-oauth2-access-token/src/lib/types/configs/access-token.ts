import { IdableConfig } from './commons';

/** Access token configuration */
export interface AccessTokenConfig {
  /**
   * By usually, the _life-time_ of the access token will be provided by
   * `expires_in` claim. But if it is not provided, use this TTL instead.
   */
  readonly accessTokenTtl?: number;

  /** The _life-time_ of refresh token. */
  readonly refreshTokenTtl?: number;
}

export interface AccessTokenConfigWithId
  extends IdableConfig,
    AccessTokenConfig {}
