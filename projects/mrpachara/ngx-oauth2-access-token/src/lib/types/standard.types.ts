export type StandardGrantTypes =
  | 'password'
  | 'client_credentials'
  | 'authorization_code'
  | 'refresh_token';

export type AccessTokenRequest = {
  grant_type: string;
  client_id?: string;
  client_secret?: string;
  state?: string;
  [param: string]: string | undefined;
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
};

export type RefreshTokenGrantAccessTokenRequest = AccessTokenRequest & {
  grant_type: 'refresh_token';
  refresh_token: string;
  scope?: string;
};

export type StandardGrantsAccesTokenRequest =
  | PasswordGrantAccessTokenRequest
  | ClientGrantAccessTokenRequest
  | AuthorizationCodeGrantAccessTokenRequest
  | RefreshTokenGrantAccessTokenRequest;

export type AuthorizationCodeRequest = {
  response_type: 'code';
  client_id: string;
  client_secret?: string;
  scope: string;
  code_challenge?: string;
  code_challenge_method?: 'S256' | 'plain';
  redirect_uri: string;
  state: string;
  [param: string]: string | undefined;
};

export type AccessToken = {
  token_type: string;
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
};
