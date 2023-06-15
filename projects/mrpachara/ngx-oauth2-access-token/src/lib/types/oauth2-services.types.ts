import { OperatorFunction } from 'rxjs';

import { AccessTokenFullConfig } from './config.types';
import {
  AccessTokenResponse,
  IdTokenClaims,
  JwtClaims,
  JwtHeader,
  JwtTokenType,
} from './standard.types';
import { KeyValuePairStorage } from './storages.types';
import { DeepReadonly } from './utils.type';

import { Oauth2Client } from '../services';
import { StoredAccessTokenResponse } from '../storage';

export type Scopes = [string, ...string[]];

export type StateData = object;

export type AccessTokenServiceInfo<C = unknown> = {
  serviceConfig: AccessTokenFullConfig;
  config: C;
  client: Oauth2Client;
  storage: KeyValuePairStorage;
};

export type AccessTokenResponseInfo<
  T extends AccessTokenResponse = AccessTokenResponse,
> = StoredAccessTokenResponse<T>;

export type ExtractorPipeReturn<
  T extends AccessTokenResponse = AccessTokenResponse,
  R = unknown,
> = OperatorFunction<DeepReadonly<AccessTokenResponseInfo<T>>, R>;

export interface AccessTokenResponseExtractor<
  T extends AccessTokenResponse = AccessTokenResponse,
  C = unknown,
  R = unknown,
> {
  onAccessTokenResponseUpdate?(
    serviceInfo: AccessTokenServiceInfo<C>,
    accessTokenResponseInfo: DeepReadonly<AccessTokenResponseInfo<T>>,
  ): Promise<void>;

  onAccessTokenResponseClear?(
    serviceInfo: AccessTokenServiceInfo<C>,
  ): Promise<void>;

  extractPipe(
    serviceInfo: AccessTokenServiceInfo<C | undefined>,
  ): ExtractorPipeReturn<T, R>;
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
