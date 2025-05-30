import { IdTokenInfo } from '../jose-info';
import { IdTokenClaims } from '../standards';
import { KeyableDataStorage } from './commons';

/** Stored ID Token Info */
export type StoredIdTokenInfo = IdTokenInfo;

/** Stored access token */
export type StoredIdTokenClaims = IdTokenClaims;

export interface StoredIdTokenInfoMap {
  readonly info: StoredIdTokenInfo;
  readonly claims: StoredIdTokenClaims;
}

export type IdTokenStorage = KeyableDataStorage<StoredIdTokenInfoMap>;
