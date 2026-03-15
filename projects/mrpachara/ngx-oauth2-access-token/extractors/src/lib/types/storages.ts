import { IdKey } from '@mrpachara/ngx-oauth2-access-token';
import {
  IdTokenClaims,
  IdTokenInfo,
} from '@mrpachara/ngx-oauth2-access-token/standard';

/** Stored ID Token Info */
export type StoredIdTokenInfo = IdTokenInfo;

/** Stored access token */
export type StoredIdTokenClaims = IdTokenClaims;

export interface StoredIdTokenKeyMap {
  readonly info: StoredIdTokenInfo;
  readonly claims: StoredIdTokenClaims;
}

export interface IdTokenStorage {
  load<const K extends keyof StoredIdTokenKeyMap>(
    id: IdKey,
    key: K,
  ): Promise<StoredIdTokenKeyMap[K] | null>;
  store<const K extends keyof StoredIdTokenKeyMap>(
    id: IdKey,
    key: K,
    data: StoredIdTokenKeyMap[K],
  ): Promise<StoredIdTokenKeyMap[K]>;
  remove<const K extends keyof StoredIdTokenKeyMap>(
    id: IdKey,
    key: K,
  ): Promise<StoredIdTokenKeyMap[K] | null>;
  clear(id: IdKey): Promise<void>;
}
