import { PickOptionalExcept } from '@mrpachara/ngx-oauth2-access-token/utility';
import { AccessTokenConfig } from '../types';

/** Default _access token_ TTL, `1_800` seconds (30 minutes) */
export const defaultAccessTokenTtl = 1_800;

/** Default _refresh token_ TTL, `2_592_000` seconds (30 days) */
export const defaultRefreshTokenTtl = 2_592_000;

/** Network latency time in units of **milliseconds** */
export const networkLatencyTime = 10_000;

/** Default access token configuration */
export const defaultConfiguration: PickOptionalExcept<
  AccessTokenConfig,
  'clientSecret'
> = {
  clientCredentialsInParams: false,
  accessTokenTtl: defaultAccessTokenTtl,
  refreshTokenTtl: defaultRefreshTokenTtl,
} as const;
