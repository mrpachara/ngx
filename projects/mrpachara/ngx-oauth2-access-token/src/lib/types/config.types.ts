import { CodeChallengeMethod } from './standard';
import { RequiredExcept } from './utils';

interface IdableConfig {
  /** The id of service, it is REQUIRED. */
  readonly id: symbol;
}

/** OAuth 2.0 client configuration */
export interface Oauth2ClientConfig {
  /** OAuth client ID, it is REQUIRED. */
  readonly clientId: string;

  /** OAuth client secret if needed, it is an OPTIONAL. */
  readonly clientSecret?: string;

  /** The URL of access token end point, it is REQUIRED. */
  readonly accessTokenUrl: string;

  /**
   * By default, the client credentials is sent by using HTTP header
   * `Authorization`. If this property is `true`, the client credentials will be
   * sent by using body content. The default value is `false`.
   */
  readonly clientCredentialsInParams?: boolean;
}

/** OAuth 2.0 client full configuration */
export type Oauth2ClientFullConfig = RequiredExcept<
  Oauth2ClientConfig,
  'clientSecret'
>;

/** Access token configuration */
export interface AccessTokenConfig extends IdableConfig {
  /** Oauth2 client configuration. */
  readonly client: Oauth2ClientConfig;

  /**
   * By usually, the _life-time_ of the access token will be provided by
   * `expires_in` claim. But if it is not provided, use this TTL instead. The
   * default value is `600_000` miliseconds (10 minutes).
   */
  readonly accessTokenTtl?: number;

  /**
   * The _life-time_ of refresh token, the default value is `2_592_000_000`
   * miliseconds (30 days).
   */
  readonly refreshTokenTtl?: number;
}

/** Access token full configuration */
export type AccessTokenFullConfig = Required<AccessTokenConfig>;

/** Authorization code configuration. */
export interface AuthorizationCodeConfig extends IdableConfig {
  /** The URL of authorization code (consent screen) end point, it is REQUIRED. */
  readonly authorizationCodeUrl: string;

  /** The redirect URI (callback URL) that matchs with client, it is REQUIRED. */
  readonly redirectUri: string;

  /**
   * If authorization code requires _PKCE_, specify the challenge method here.
   * The default value is `'none'`.
   */
  readonly pkce?: CodeChallengeMethod;

  /**
   * The _life-time_ of `state`, the default value is `600_000` miliseconds (10
   * minutes).
   */
  readonly stateTtl?: number;

  /** The code verifier length, the default value is `56`. */
  readonly codeVerifierLength?: number;

  /** The state length, the default value is `32`. */
  readonly stateLength?: number;
}

/** Authorization code full configuration */
export type AuthorizationCodeFullConfig = RequiredExcept<
  AuthorizationCodeConfig,
  'pkce'
>;

/** Refresh token configuration */
export interface RefreshTokenConfig {
  /**
   * The _life-time_ of refresh token, the default value is `2_592_000_000`
   * miliseconds (30 days).
   */
  readonly refreshTokenTtl?: number;
}

/** Refresh token full configuration */
export type RefreshTokenFullConfig = Required<RefreshTokenConfig>;

/** ID token configuration */
export interface IdTokenConfig {
  /**
   * By default, the ID token will be extracted from `id_token` claim. If this
   * property is `true`, the ID token will be extracted from `access_token`
   * cliam. The default value is `false`.
   */
  readonly providedInAccessToken?: boolean;
}

/** ID token full configuration */
export type IdTokenFullConfig = Required<IdTokenConfig>;

/** JWK configuration */
export interface JwkConfig extends IdableConfig {
  /** The issuer value that matchs `iss` claim in JWT, it is REQUIRED. */
  readonly issuer: string;

  /** The URL of JWK Set, it is REQUIRED. */
  readonly jwkSetUrl: string;
}

/** JWK full full configuration */
export type JwkFullConfig = Required<JwkConfig>;
