import { OperatorFunction } from 'rxjs';

import {
  AccessTokenResponse,
  IdTokenClaims,
  JwtClaims,
  JwtHeader,
  JwtTokenType,
} from './standard.types';
import { StateData, StoredAccessTokenResponse } from './storages.types';
import { AccessTokenFullConfig } from './config.types';

import { Oauth2Client } from '../services';

export type Scopes = [string, ...string[]];

export type AccessTokenServiceInfo<C = unknown> = {
  serviceConfig: AccessTokenFullConfig;
  config: C;
  client: Oauth2Client;
};

export type AccessTokenResponseInfo<
  T extends AccessTokenResponse = AccessTokenResponse,
> = StoredAccessTokenResponse<T>;

export type ExtractorPipeReturn<
  T extends AccessTokenResponse = AccessTokenResponse,
  R = unknown,
> = OperatorFunction<AccessTokenResponseInfo<T>, R>;

export interface AccessTokenResponseExtractor<
  T extends AccessTokenResponse = AccessTokenResponse,
  C = unknown,
  R = unknown,
> {
  onAccessTokenResponseUpdate?(
    serviceInfo: AccessTokenServiceInfo<C>,
    accessTokenResponseInfo: AccessTokenResponseInfo<T>,
  ): Promise<void>;

  onAccessTokenResponseClear?(
    serviceInfo: AccessTokenServiceInfo<C>,
  ): Promise<void>;

  extractPipe(
    serviceInfo: AccessTokenServiceInfo<C | undefined>,
  ): ExtractorPipeReturn<T, R>;
}

export interface AccessTokenServiceInfoProvidable {
  serviceInfo<T extends AccessTokenResponse, C>(
    extractor: AccessTokenResponseExtractor<T, C>,
  ): AccessTokenServiceInfo<C>;
}

export type AccessTokenInfo = {
  type: string;
  token: string;
};

export type StateAuthorizationCode = StateData & {
  codeVerifier?: string;
};

export type EncryptedPayload = string;

export type JwtBaseInfo<T extends JwtClaims | EncryptedPayload> = {
  token: JwtTokenType;
  content: string;
  header: JwtHeader;
  payload: T;
  signature?: Uint8Array;
};

export type JwtInfo<T extends JwtClaims = JwtClaims> = JwtBaseInfo<T>;

export type JwtUnknownInfo<T extends JwtClaims = JwtClaims> =
  | JwtInfo<T>
  | JwtBaseInfo<EncryptedPayload>;

export type IdTokenResponse = AccessTokenResponse & {
  id_token?: JwtTokenType;
};

export type IdTokenInfo = JwtInfo<IdTokenClaims>;
