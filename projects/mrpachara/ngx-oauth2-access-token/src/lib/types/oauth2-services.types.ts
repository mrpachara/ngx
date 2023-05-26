import {
  IdTokenClaims,
  JwtClaims,
  JwtHeader,
  JwtTokenType,
} from './standard.types';
import { StateData, StoredAccessToken } from './storages.types';

export type Scopes = [string, ...string[]];

export interface TokenExtractor<T extends StoredAccessToken, R> {
  extractToken(serviceName: string, storingAccessToken: T): Promise<R | void>;
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
