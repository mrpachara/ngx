import {
  IdTokenClaims,
  JwtClaims,
  JwtHeader,
  JwtTokenType,
} from './standard.types';
import { StateData, StoredAccessToken } from './storages.types';

export type Scopes = [string, ...string[]];

export interface TokenResponseListener<T extends StoredAccessToken> {
  onTokenResponseUpdate(
    serviceName: string,
    storingAccessToken: T,
  ): Promise<void>;
}

export interface TokenResponseExtractor<T extends StoredAccessToken, R> {
  fetchExistedExtractedResult?(serviceName: string): Promise<R>;
  extractTokenResponse(
    serviceName: string,
    storingAccessToken: T,
    throwError: boolean,
  ): Promise<R | null>;
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

export type StateAuthorizationParams = StateData & {
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

export type StoredIdTokenParams = StoredAccessToken & {
  id_token?: JwtTokenType;
};

export type IdTokenInfo = JwtInfo<IdTokenClaims>;
