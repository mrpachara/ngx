export type AccessTokenRequest = {
  grant_type: string;
  client_id?: string;
  client_secret?: string;
  state?: string;
};

export type PasswordGrantAccessTokenRequest = AccessTokenRequest & {
  grant_type: 'password';
  username: string;
  password: string;
  scope: string;
};

export type ClientGrantAccessTokenRequest = AccessTokenRequest & {
  grant_type: 'client_credentials';
  scope: string;
};

export type AuthorizationCodeGrantAccessTokenRequest = AccessTokenRequest & {
  grant_type: 'authorization_code';
  code: string;
  code_verifier?: string;
  redirect_uri: string;
  scope?: never;
};

export type RefreshTokenGrantAccessTokenRequest = AccessTokenRequest & {
  grant_type: 'refresh_token';
  refresh_token: string;
  scope?: string;
};

export type CustomGrantAccessTokenRequest = AccessTokenRequest & {
  grant_type: `urn:${string}`;
};

export type StandardGrantsAccesTokenRequest =
  | PasswordGrantAccessTokenRequest
  | ClientGrantAccessTokenRequest
  | AuthorizationCodeGrantAccessTokenRequest
  | RefreshTokenGrantAccessTokenRequest
  | CustomGrantAccessTokenRequest;

export type CodeChallengeMethod = 'S256' | 'plain';

export type AuthorizationCodeRequest = {
  response_type: 'code';
  client_id: string;
  client_secret?: never;
  scope: string;
  code_challenge?: string;
  code_challenge_method?: CodeChallengeMethod;
  redirect_uri: string;
  state: string;
};

export type AccessToken = {
  token_type: string;
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
};

export type StandardGrantTypes = StandardGrantsAccesTokenRequest['grant_type'];

export type Oauth2ErrorResponse = {
  error: string;
  error_description: string;
};
