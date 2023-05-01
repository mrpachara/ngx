export type GrantParams = {
  grant_type: string;
  state?: string;
};

export type PasswordGrantParams = GrantParams & {
  grant_type: 'password';
  username: string;
  password: string;
  scope: string;
};

export type ClientGrantParams = GrantParams & {
  grant_type: 'client_credentials';
  scope: string;
};

export type AuthorizationCodeGrantParams = GrantParams & {
  grant_type: 'authorization_code';
  code: string;
  code_verifier?: string;
  redirect_uri: string;
  [param: string]: string | undefined;
};

export type RefreshTokenGrantParams = GrantParams & {
  grant_type: 'refresh_token';
  refresh_token: string;
  scope?: string;
};

export type StandardGrantsParams =
  | PasswordGrantParams
  | ClientGrantParams
  | AuthorizationCodeGrantParams
  | RefreshTokenGrantParams;

export type AuthorizationCodeParams = {
  response_type: 'code';
  scope: string;
  code_challenge?: string;
  code_challenge_method?: 'S256' | 'plain';
  redirect_uri: string;
  state?: string;
  [param: string]: string | undefined;
};
