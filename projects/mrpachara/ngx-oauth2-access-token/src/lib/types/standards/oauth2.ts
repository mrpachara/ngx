import { MakeNever } from '../utils';
import { CompactJws } from './jws';

/** Base Grant */
export interface AccessTokenRequest {
  /** REQUIRED. The type of granting. */
  readonly grant_type: string;

  /**
   * REQUIRED, if the client is not authenticating with the authorization server
   * as described in [Section
   * 3.2.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.2.1).
   */
  readonly client_id?: string;

  /**
   * REQUIRED, if the client is not authenticating with the authorization server
   * as described in [Section
   * 3.2.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.2.1).
   */
  readonly client_secret?: string;
}

interface Scopable {
  /**
   * REQUIRED. The scope of the access request as described by [Section
   * 3.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.3).
   */
  readonly scope?: string;
}

/** Authorization Code Grant */
export interface AuthorizationCodeGrantAccessTokenRequest
  extends AccessTokenRequest {
  readonly grant_type: 'authorization_code';

  /** REQUIRED. The authorization code received from the authorization server. */
  readonly code: string;

  /**
   * REQUIRED, if authorization request as
   * [PKCE](https://www.rfc-editor.org/rfc/rfc7636.html). Code verifier
   */
  readonly code_verifier?: string;

  /**
   * REQUIRED, if the `"redirect_uri"` parameter was included in the
   * authorization request as described in [Section
   * 4.1.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.1), and
   * their values **MUST** be identical.
   */
  readonly redirect_uri: string;

  /** **Do not** assign `scope` for this grant type. */
  readonly scope?: never;
}

/** Resource Owner Password Credentials Grant */
export interface PasswordGrantAccessTokenRequest
  extends AccessTokenRequest,
    Scopable {
  readonly grant_type: 'password';

  /** REQUIRED. The resource owner username. */
  readonly username: string;

  /** REQUIRED. The resource owner password. */
  readonly password: string;
}

/** Client Credentials Grant */
export interface ClientGrantAccessTokenRequest
  extends AccessTokenRequest,
    Scopable {
  readonly grant_type: 'client_credentials';
}

/** Refreshing an Access Token Grant */
export interface RefreshTokenGrantAccessTokenRequest
  extends AccessTokenRequest {
  readonly grant_type: 'refresh_token';

  /** REQUIRED. The refresh token issued to the client. */
  readonly refresh_token: string;

  /**
   * OPTIONAL. The scope of the access request as described by [Section
   * 3.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.3). The
   * requested scope **MUST NOT** include any scope not originally granted by
   * the resource owner, and if omitted is treated as equal to the scope
   * originally granted by the resource owner.
   */
  readonly scope?: string;
}

export type ExtensionGrantType = `urn:${string}`;
export type ExtensionGrantData = object & {
  readonly grant_type?: never;
} & {
  readonly [K in keyof AccessTokenRequest]?: never;
} & {
  readonly [K in keyof Scopable]?: never;
};

export interface ExtensionWithoutDataGrant<
  G extends ExtensionGrantType = ExtensionGrantType,
> {
  readonly grantType: G;
  readonly dataType?: never;
}

export interface ExtensionWithDataGrant<
  G extends ExtensionGrantType = ExtensionGrantType,
  R extends ExtensionGrantData = ExtensionGrantData,
> {
  readonly grantType: G;
  readonly dataType: R;
}

export type ExtensionWithoutDataGrantAccessTokenRequest<
  EG extends ExtensionWithoutDataGrant = ExtensionWithoutDataGrant,
> = AccessTokenRequest & {
  readonly grant_type: EG['grantType'];
};

export type ExtensionWithDataGrantAccessTokenRequest<
  EG extends ExtensionWithDataGrant = ExtensionWithDataGrant,
> = AccessTokenRequest & {
  readonly grant_type: EG['grantType'];
} & {
  readonly [K in keyof EG['dataType']]: EG['dataType'][K];
};

/** Extension Grant */
export type ExtensionGrantAccessTokenRequest<
  EG extends ExtensionWithoutDataGrant | ExtensionWithDataGrant =
    | ExtensionWithoutDataGrant
    | ExtensionWithDataGrant,
> = EG extends ExtensionWithoutDataGrant
  ? ExtensionWithoutDataGrantAccessTokenRequest<EG>
  : EG extends ExtensionWithDataGrant
    ? ExtensionWithDataGrantAccessTokenRequest<EG>
    : never;

/** Standard grant for requesting access-token */
export type StandardGrantAccesTokenRequest =
  | AuthorizationCodeGrantAccessTokenRequest
  | PasswordGrantAccessTokenRequest
  | ClientGrantAccessTokenRequest
  | ExtensionGrantAccessTokenRequest
  | RefreshTokenGrantAccessTokenRequest;

/** Challenge method for PKCE reqeust */
export type CodeChallengeMethod = 'S256' | 'plain';

/** Authorization Code Request */
export interface AuthorizationCodeBasicRequest {
  /** REQUIRED. Value **MUST** be set to `"code"`. */
  readonly response_type: 'code';

  /**
   * REQUIRED. The client identifier as described in [Section
   * 2.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.2).
   */
  readonly client_id: string;

  /** **Do not** assign `client_secret` for authorization requesting. */
  readonly client_secret?: never;

  /**
   * REQUIRED. The scope of the access request as described by [Section
   * 3.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.3).
   */
  readonly scope: string;

  /**
   * REQUIRED. As described in [Section
   * 3.1.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1.2).
   */
  readonly redirect_uri: string;

  /**
   * RECOMMENDED. An opaque value used by the client to maintain state between
   * the request and callback. The authorization server includes this value when
   * redirecting the user-agent back to the client. The parameter **SHOULD** be
   * used for preventing cross-site request forgery as described in [Section
   * 10.12](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.12).
   */
  readonly state?: string;
}

/** Authorization Code with `code_challenge` Request */
export interface WithCodeChallengeRequest {
  /**
   * REQUIRED, if authorization request as
   * [PKCE](https://www.rfc-editor.org/rfc/rfc7636.html). Code challenge.
   */
  readonly code_challenge: string;

  /**
   * OPTIONAL, defaults to `"plain"` if not present in the request. Code
   * verifier transformation method is `"S256"` or `"plain"`.
   */
  readonly code_challenge_method?: CodeChallengeMethod;
}

/** Authorization Code **without** `code_challenge` Request */
export type WithoutCodeChallengeRequest = MakeNever<WithCodeChallengeRequest>;

/** Authorization Code Request */
export type AuthorizationCodeRequest = AuthorizationCodeBasicRequest &
  (WithCodeChallengeRequest | WithoutCodeChallengeRequest);

/** Access Token Response */
export interface AccessTokenResponse {
  /** REQUIRED. The access token issued by the authorization server. */
  readonly access_token: string;

  /**
   * REQUIRED. The type of the token issued as described in [Section
   * 7.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-7.1). Value is
   * case insensitive.
   */
  readonly token_type: string;

  /**
   * RECOMMENDED. The lifetime in seconds of the access token. For example, the
   * value `"3600"` denotes that the access token will expire in one hour from
   * the time the response was generated. If omitted, the authorization server
   * **SHOULD** provide the expiration time via other means or document the
   * default value.
   */
  readonly expires_in?: number;

  /**
   * OPTIONAL, if identical to the scope requested by the client; otherwise,
   * REQUIRED. The scope of the access token as described by [Section
   * 3.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.3).
   */
  readonly scope?: string;

  /**
   * OPTIONAL. The refresh token, which can be used to obtain new access tokens
   * using the same authorization grant as described in [Section
   * 6](https://www.rfc-editor.org/rfc/rfc6749.html#section-6).
   */
  readonly refresh_token?: string;
}

export interface IdTokenResponse {
  readonly id_token: CompactJws;
}

/** Standard grant type */
export type StandardGrantType = StandardGrantAccesTokenRequest['grant_type'];

/** OAuth 2.0 Error Response */
export interface Oauth2ErrorResponse {
  /** REQUIRED. A single ASCII error code from the following: */
  readonly error: string;

  /**
   * OPTIONAL. Human-readable ASCII text providing additional information, used
   * to assist the client developer in understanding the error that occurred.
   * Values for the `"error_description"` parameter **MUST NOT** include
   * characters outside the set `%x20-21` /` %x23-5B` / `%x5D-7E`.
   */
  readonly error_description?: string;
}
