import {
  IdTokenClaims,
  IdTokenInfo,
  KeyableDataStorage,
} from '@mrpachara/ngx-oauth2-access-token';

/** Stored ID Token Info */
export type StoredIdTokenInfo = IdTokenInfo;

/** Stored access token */
export type StoredIdTokenClaims = IdTokenClaims;

export interface StoredIdTokenInfoMap {
  readonly info: StoredIdTokenInfo;
  readonly claims: StoredIdTokenClaims;
}

export type IdTokenStorage = KeyableDataStorage<StoredIdTokenInfoMap>;
