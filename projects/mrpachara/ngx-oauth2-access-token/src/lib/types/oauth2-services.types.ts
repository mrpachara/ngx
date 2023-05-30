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
import { Oauth2Client } from '../oauth2.client';

export type Scopes = [string, ...string[]];

export type AccessTokenServiceInfo<C = unknown> = {
  serviceConfig: AccessTokenFullConfig;
  config: C;
  client: Oauth2Client;
};

export type AccessTokenResponseInfo<
  T extends AccessTokenResponse = AccessTokenResponse,
> = StoredAccessTokenResponse<T>;

export interface AccessTokenResponseListener<
  T extends AccessTokenResponse = AccessTokenResponse,
  C = unknown,
> {
  /** @internal */
  onAccessTokenResponseUpdate(
    serviceInfo: AccessTokenServiceInfo<C>,
    accessTokenResponseInfo: AccessTokenResponseInfo<T>,
  ): Promise<void>;

  /** @internal */
  onAccessTokenResponseClear(
    serviceInfo: AccessTokenServiceInfo<C>,
  ): Promise<void>;
}

export type ExtractorPipeReturn<
  T extends AccessTokenResponse = AccessTokenResponse,
  R = unknown,
> = OperatorFunction<AccessTokenResponseInfo<T>, R>;

export interface AccessTokenResponseExtractor<
  T extends AccessTokenResponse = AccessTokenResponse,
  C = unknown,
  R = unknown,
> {
  /** @internal */
  extractPipe(
    serviceInfo: AccessTokenServiceInfo<C | undefined>,
  ): ExtractorPipeReturn<T, R>;
}

export class SkipReloadAccessToken implements Error {
  readonly name: string;
  readonly message: string;
  readonly stack: string;

  constructor(readonly skipedName: string, readonly cause: unknown) {
    this.name = this.constructor.name;
    this.message = `Skip reload access token for ${this.skipedName}`;
    this.stack = `${this}\n`;
  }

  toString(): string {
    return `${this.name}: ${this.message}`;
  }
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
  signature?: string;
};

export type JwtInfo<T extends JwtClaims = JwtClaims> = JwtBaseInfo<T>;

export type JwtUnknownInfo<T extends JwtClaims = JwtClaims> =
  | JwtInfo<T>
  | JwtBaseInfo<EncryptedPayload>;

export type IdTokenResponse = AccessTokenResponse & {
  id_token?: JwtTokenType;
};

export type IdTokenInfo = JwtInfo<IdTokenClaims>;
