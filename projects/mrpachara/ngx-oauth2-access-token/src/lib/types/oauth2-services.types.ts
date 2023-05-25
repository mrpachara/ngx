import {
  IdTokenClaims,
  JwtClaims,
  JwtHeader,
  JwtTokenType,
} from './standard.types';
import { StoredAccessToken } from './storages.types';

declare module './storages.types' {
  interface StateData {
    codeVerifier?: string;
  }
}

export type Scopes = [string, ...string[]];

export interface TokenExtractor<T extends StoredAccessToken, R> {
  extractToken(storingAccessToken: T): Promise<R | void>;
}

export type AccessTokenInfo = {
  type: string;
  token: string;
};

export type EncryptedPayload = string;

export type JwtBaseInfo<T extends JwtClaims | EncryptedPayload> = {
  header: JwtHeader;
  payload: T;
  content: string;
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
