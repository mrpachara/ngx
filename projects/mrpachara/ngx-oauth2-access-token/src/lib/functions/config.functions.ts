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
};

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
  };
}

const defaultAccessTokenTtl = 10 * 60 * 1000;

/** Default access token configuration */
export const defaultAccessTokenConfig: PickOptional<AccessTokenConfig> = {
  additionalParams: {},
  accessTokenTtl: defaultAccessTokenTtl,
};

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
  };
}

const defaultStateTtl = 10 * 60 * 1000;
const defaultCodeVerifierLength = 56;

/** Default authorization code configuration */
export const defaultAuthorizationCodeConfig: PickOptional<AuthorizationCodeConfig> =
  {
    pkce: 'none',
    stateTtl: defaultStateTtl,
    codeVerifierLength: defaultCodeVerifierLength,
    additionalParams: {},
  };

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
  };
}

const defaultRefreshTokenTtl = 30 * 24 * 60 * 60 * 1000;

/** Default refresh token configuration */
export const defaultRefreshTokenConfig: PickOptional<RefreshTokenConfig> = {
  refreshTokenTtl: defaultRefreshTokenTtl,
};

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
  };
}

/** Default ID token configuration */
export const defaultIdTokenConfig: PickOptional<IdTokenConfig> = {
  providedInAccessToken: false,
};

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
  };
}

/** Default JWK configuration */
export const defaultJwkConfig: PickOptional<JwkConfig> = {};

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
  };
}
