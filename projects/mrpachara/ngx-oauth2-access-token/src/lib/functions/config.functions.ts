import {
  AccessTokenConfig,
  AccessTokenFullConfig,
  AccessTokenResponseListenerInfo,
  AuthorizationCodeConfig,
  AuthorizationCodeFullConfig,
  IdTokenConfig,
  IdTokenFullConfig,
  Oauth2ClientConfig,
  Oauth2ClientFullConfig,
  PickOptional,
  RefreshTokenConfig,
  RefreshTokenFullConfig,
} from '../types';

export const defaultOauth2ClientConfig: PickOptional<
  Omit<Oauth2ClientConfig, 'clientSecret'>
> = {
  debug: false,
  clientCredentialsInParams: false,
};

export function configOauth2Client(
  config: Oauth2ClientConfig,
): Oauth2ClientFullConfig {
  return {
    ...defaultOauth2ClientConfig,
    ...config,
  };
}

const defaultAccessTokenTtl = 10 * 60 * 1000;

export const defaultAccessTokenConfig: PickOptional<AccessTokenConfig> = {
  debug: false,
  additionalParams: {},
  accessTokenTtl: defaultAccessTokenTtl,
};

export function configAccessToken(
  config: AccessTokenConfig,
  listeners: AccessTokenResponseListenerInfo[],
): AccessTokenFullConfig {
  return {
    ...defaultAccessTokenConfig,
    ...config,
    listeners,
  };
}

const defaultStateTtl = 10 * 60 * 1000;
const defaultCodeVerifierLength = 56;

export const defaultAuthorizationCodeConfig: PickOptional<AuthorizationCodeConfig> =
  {
    debug: false,
    pkce: 'none',
    stateTtl: defaultStateTtl,
    codeVerifierLength: defaultCodeVerifierLength,
    additionalParams: {},
  };

export function configAuthorizationCode(
  config: AuthorizationCodeConfig,
): AuthorizationCodeFullConfig {
  return {
    ...defaultAuthorizationCodeConfig,
    ...config,
  };
}

const defaultRefreshTokenTtl = 30 * 24 * 60 * 60 * 1000;

export const defaultRefreshTokenConfig: PickOptional<RefreshTokenConfig> = {
  refreshTokenTtl: defaultRefreshTokenTtl,
};

export function configRefreshToken(
  config: RefreshTokenConfig,
): RefreshTokenFullConfig {
  return {
    ...defaultRefreshTokenConfig,
    ...config,
  };
}

export const defaultIdTokenConfig: PickOptional<IdTokenConfig> = {
  providedInAccessToken: false,
};

export function configIdToken(config: IdTokenConfig): IdTokenFullConfig {
  return {
    ...defaultIdTokenConfig,
    ...config,
  };
}
