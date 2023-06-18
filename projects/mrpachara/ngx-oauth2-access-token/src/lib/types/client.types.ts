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

/** The service parameters for requesting access token */
export type GrantParams = OmitClientDetails<AccessTokenRequest>;

/** The service parameters for requesting access token by using password grant */
export type PasswordGrantParams =
  OmitClientDetails<PasswordGrantAccessTokenRequest>;

/** The service parameters for requesting access token by using client grant */
export type ClientGrantParams =
  OmitClientDetails<ClientGrantAccessTokenRequest>;

/**
 * The service parameters for requesting access token by using authorization
 * code grant
 */
export type AuthorizationCodeGrantParams =
  OmitClientDetails<AuthorizationCodeGrantAccessTokenRequest>;

/**
 * The service parameters for requesting access token by using refresh token
 * grant
 */
export type RefreshTokenGrantParams =
  OmitClientDetails<RefreshTokenGrantAccessTokenRequest>;

/** The service parameters for requesting access token by using extension grant */
export type ExtensionGrantParams =
  OmitClientDetails<ExtensionGrantAccessTokenRequest>;

/** The service parameters for requesting access token by using standard grant */
export type StandardGrantsParams =
  | PasswordGrantParams
  | ClientGrantParams
  | AuthorizationCodeGrantParams
  | RefreshTokenGrantParams
  | ExtensionGrantParams;

/** The service parameters for requesting authrization code */
export type AuthorizationCodeParams =
  OmitClientDetails<AuthorizationCodeRequest>;

/** OAuth 2.0 error response transformer function */
export type Oauth2ClientErrorTransformer = (
  err: HttpErrorResponse,
) => Required<Oauth2ErrorResponse>;
