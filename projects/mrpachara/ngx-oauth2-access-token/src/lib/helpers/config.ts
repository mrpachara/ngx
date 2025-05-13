import {
  AccessTokenConfig,
  AccessTokenFullConfig,
  AuthorizationCodeConfig,
  AuthorizationCodeFullConfig,
  IdTokenConfig,
  IdTokenFullConfig,
  JwkConfig,
  JwkFullConfig,
  Oauth2ClientConfig,
  Oauth2ClientFullConfig,
  PickOptional,
  RefreshTokenConfig,
  RefreshTokenFullConfig,
} from '../types';

/** Default OAuth 2.0 client configuration */
export const defaultOauth2ClientConfig: PickOptional<
  Omit<Oauth2ClientConfig, 'clientSecret'>
> = {
  clientCredentialsInParams: false,
} as const;

/**
 * Create the full OAuth 2.0 client configuration.
 *
 * @param config The configuration
 * @returns The full configuration
 */
export function configOauth2Client(
  config: Oauth2ClientConfig,
): Oauth2ClientFullConfig {
  return {
    ...defaultOauth2ClientConfig,
    ...config,
  } as const;
}

/** `600_000` miliseconds (10 minutes) */
const defaultAccessTokenTtl = 600_000;

/** `2_592_000_000` miliseconds (30 days) */
const defaultRefreshTokenTtl = 2_592_000_000;

/** Default access token configuration */
export const defaultAccessTokenConfig: PickOptional<AccessTokenConfig> = {
  additionalParams: {} as const,
  accessTokenTtl: defaultAccessTokenTtl,
  refreshTokenTtl: defaultRefreshTokenTtl,
} as const;

/**
 * Create the full access token configuration.
 *
 * @param config The configuration
 * @returns The full configuration
 */
export function configAccessToken(
  config: AccessTokenConfig,
): AccessTokenFullConfig {
  return {
    ...defaultAccessTokenConfig,
    ...config,
  } as const;
}

const defaultStateTtl = 10 * 60 * 1_000;
const defaultCodeVerifierLength = 56;

/** Default authorization code configuration */
export const defaultAuthorizationCodeConfig: PickOptional<AuthorizationCodeConfig> =
  {
    pkce: 'none',
    stateTtl: defaultStateTtl,
    codeVerifierLength: defaultCodeVerifierLength,
    additionalParams: {} as const,
  } as const;

/**
 * Create the full authorization code configuration.
 *
 * @param config The configuration
 * @returns The full configuration
 */
export function configAuthorizationCode(
  config: AuthorizationCodeConfig,
): AuthorizationCodeFullConfig {
  return {
    ...defaultAuthorizationCodeConfig,
    ...config,
  } as const;
}

/** Default refresh token configuration */
export const defaultRefreshTokenConfig: PickOptional<RefreshTokenConfig> = {
  refreshTokenTtl: defaultRefreshTokenTtl,
} as const;

/**
 * Create the full refresh token configuration.
 *
 * @param config The configuration
 * @returns The full configuration
 */
export function configRefreshToken(
  config: RefreshTokenConfig,
): RefreshTokenFullConfig {
  return {
    ...defaultRefreshTokenConfig,
    ...config,
  } as const;
}

/** Default ID token configuration */
export const defaultIdTokenConfig: PickOptional<IdTokenConfig> = {
  providedInAccessToken: false,
} as const;

/**
 * Create the full ID token configuration.
 *
 * @param config The configuration
 * @returns The full configuration
 */
export function configIdToken(config: IdTokenConfig): IdTokenFullConfig {
  return {
    ...defaultIdTokenConfig,
    ...config,
  } as const;
}

/** Default JWK configuration */
export const defaultJwkConfig: PickOptional<JwkConfig> = {} as const;

/**
 * Create the full JWK configuration.
 *
 * @param config The configuration
 * @returns The full configuration
 */
export function configJwk(config: JwkConfig): JwkFullConfig {
  return {
    ...defaultJwkConfig,
    ...config,
  } as const;
}
