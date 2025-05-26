import { AccessTokenResponse, Uuid } from '../../types';
import { KeyableDataStorage, StoredData } from './commons';

/** Stored access token */
export type StoredAccessToken = StoredData<AccessTokenResponse>;

/** Stored access token */
export type StoredRefreshToken = StoredData<string>;

export interface StoredAccessTokenMap {
  readonly access: StoredAccessToken;
  readonly refresh: StoredRefreshToken;
}

export type AccessTokenStorage = KeyableDataStorage<StoredAccessTokenMap>;

export interface AccessTokenStorageMessageType<T extends string> {
  readonly type: T;
  readonly timestamp: number;
  readonly from: Uuid;
  readonly to?: Uuid;
}

export type AccessTokenStorageMessage =
  AccessTokenStorageMessageType<'release'>;
