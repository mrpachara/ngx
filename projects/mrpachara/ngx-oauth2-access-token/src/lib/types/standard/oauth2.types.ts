/** Base Grant */
export interface AccessTokenRequest {
  /** REQUIRED. The type of granting. */
  grant_type: string;

  /**
   * REQUIRED, if the client is not authenticating with the authorization server
   * as described in [Section
   * 3.2.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.2.1).
   */
  client_id?: string;

  /**
   * REQUIRED, if the client is not authenticating with the authorization server
   * as described in [Section
   * 3.2.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.2.1).
   */
  client_secret?: string;
}

interface Scopable {
  /**
   * REQUIRED. The scope of the access request as described by [Section
   * 3.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.3).
   */
  scope: string;
}

/** Resource Owner Password Credentials Grant */
export interface PasswordGrantAccessTokenRequest
  extends AccessTokenRequest,
    Scopable {
  grant_type: 'password';

  /** REQUIRED. The resource owner username. */
  username: string;

  /** REQUIRED. The resource owner password. */
  password: string;
}

/** Client Credentials Grant */
export interface ClientGrantAccessTokenRequest
  extends AccessTokenRequest,
    Scopable {
  grant_type: 'client_credentials';
}

/** Authorization Code Grant */
export interface AuthorizationCodeGrantAccessTokenRequest
  extends AccessTokenRequest {
  grant_type: 'authorization_code';

  /** REQUIRED. The authorization code received from the authorization server. */
  code: string;

  /**
   * REQUIRED, if authorization request as
   * [PKCE](https://datatracker.ietf.org/doc/html/rfc7636). Code verifier
   */
  code_verifier?: string;

  /**
   * REQUIRED, if the `"redirect_uri"` parameter was included in the
   * authorization request as described in [Section
   * 4.1.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.1), and
   * their values **MUST** be identical.
   */
  redirect_uri: string;

  /** **Do not** assign `scope` for this grant type. */
  scope?: never;
}

/** Refreshing an Access Token Grant */
export interface RefreshTokenGrantAccessTokenRequest
  extends AccessTokenRequest {
  grant_type: 'refresh_token';

  /** REQUIRED. The refresh token issued to the client. */
  refresh_token: string;

  /**
   * OPTIONAL. The scope of the access request as described by [Section
   * 3.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.3). The
   * requested scope **MUST NOT** include any scope not originally granted by
   * the resource owner, and if omitted is treated as equal to the scope
   * originally granted by the resource owner.
   */
  scope?: string;
}

/** Extension Grant */
export interface ExtensionGrantAccessTokenRequest extends AccessTokenRequest {
  grant_type: `urn:${string}`;
}

export type StandardGrantsAccesTokenRequest =
  | PasswordGrantAccessTokenRequest
  | ClientGrantAccessTokenRequest
  | AuthorizationCodeGrantAccessTokenRequest
  | RefreshTokenGrantAccessTokenRequest
  | ExtensionGrantAccessTokenRequest;

export type CodeChallengeMethod = 'S256' | 'plain';

/** Authorization Code Request */
export interface AuthorizationCodeRequest {
  /** REQUIRED. Value **MUST** be set to `"code"`. */
  response_type: 'code';

  /**
   * REQUIRED. The client identifier as described in [Section
   * 2.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.2).
   */
  client_id: string;

  /** **Do not** assign `client_secret` for authorization requesting. */
  client_secret?: never;

  /**
   * REQUIRED. The scope of the access request as described by [Section
   * 3.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.3).
   */
  scope: string;

  /**
   * REQUIRED, if authorization request as
   * [PKCE](https://datatracker.ietf.org/doc/html/rfc7636). Code challenge.
   */
  code_challenge?: string;

  /**
   * OPTIONAL, defaults to `"plain"` if not present in the request. Code
   * verifier transformation method is `"S256"` or `"plain"`.
   */
  code_challenge_method?: CodeChallengeMethod;

  /**
   * REQUIRED. As described in [Section
   * 3.1.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1.2).
   */
  redirect_uri: string;

  /**
   * RECOMMENDED. An opaque value used by the client to maintain state between
   * the request and callback. The authorization server includes this value when
   * redirecting the user-agent back to the client. The parameter **SHOULD** be
   * used for preventing cross-site request forgery as described in [Section
   * 10.12](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.12).
   */
  state: string;
}

/** Access Token Response */
export interface AccessTokenResponse {
  /** REQUIRED. The access token issued by the authorization server. */
  access_token: string;

  /**
   * REQUIRED. The type of the token issued as described in [Section
   * 7.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-7.1). Value is
   * case insensitive.
   */
  token_type: string;

  /**
   * RECOMMENDED. The lifetime in seconds of the access token. For example, the
   * value `"3600"` denotes that the access token will expire in one hour from
   * the time the response was generated. If omitted, the authorization server
   * **SHOULD** provide the expiration time via other means or document the
   * default value.
   */
  expires_in?: number;

  /**
   * OPTIONAL, if identical to the scope requested by the client; otherwise,
   * REQUIRED. The scope of the access token as described by [Section
   * 3.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.3).
   */
  scope?: string;

  /**
   * OPTIONAL. The refresh token, which can be used to obtain new access tokens
   * using the same authorization grant as described in [Section
   * 6](https://www.rfc-editor.org/rfc/rfc6749.html#section-6).
   */
  refresh_token?: string;
}

export type StandardGrantType = StandardGrantsAccesTokenRequest['grant_type'];

/** Oauth 2.0 Error Response */
export interface Oauth2ErrorResponse {
  /** REQUIRED. A single ASCII error code from the following: */
  error: string;

  /**
   * OPTIONAL. Human-readable ASCII text providing additional information, used
   * to assist the client developer in understanding the error that occurred.
   * Values for the `"error_description"` parameter **MUST NOT** include
   * characters outside the set `%x20-21` /` %x23-5B` / `%x5D-7E`.
   */
  error_description?: string;
}
