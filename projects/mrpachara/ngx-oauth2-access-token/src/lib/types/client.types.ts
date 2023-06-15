import { HttpErrorResponse } from '@angular/common/http';

import {
  AccessTokenRequest,
  AuthorizationCodeGrantAccessTokenRequest,
  AuthorizationCodeRequest,
  ClientGrantAccessTokenRequest,
  ExtensionGrantAccessTokenRequest,
  Oauth2ErrorResponse,
  PasswordGrantAccessTokenRequest,
  RefreshTokenGrantAccessTokenRequest,
  StandardGrantsAccesTokenRequest,
} from './standard.types';

type OmitClientDetails<
  T extends
    | AccessTokenRequest
    | StandardGrantsAccesTokenRequest
    | AuthorizationCodeRequest,
> = Omit<T, 'client_id' | 'client_secret'>;

export type GrantParams = OmitClientDetails<AccessTokenRequest>;

export type PasswordGrantParams =
  OmitClientDetails<PasswordGrantAccessTokenRequest>;

export type ClientGrantParams =
  OmitClientDetails<ClientGrantAccessTokenRequest>;

export type AuthorizationCodeGrantParams =
  OmitClientDetails<AuthorizationCodeGrantAccessTokenRequest>;

export type RefreshTokenGrantParams =
  OmitClientDetails<RefreshTokenGrantAccessTokenRequest>;

export type ExtensionGrantParams =
  OmitClientDetails<ExtensionGrantAccessTokenRequest>;

export type StandardGrantsParams =
  | PasswordGrantParams
  | ClientGrantParams
  | AuthorizationCodeGrantParams
  | RefreshTokenGrantParams
  | ExtensionGrantParams;

export type AuthorizationCodeParams =
  OmitClientDetails<AuthorizationCodeRequest>;

export type Oauth2ClientErrorTransformer = (
  err: HttpErrorResponse,
) => Required<Oauth2ErrorResponse>;
