import { AccessTokenResponse, Uuid } from '../../types';
import { KeyableDataStorage, Lockable, StoredData } from './commons';

/** Stored access token */
export type StoredAccessToken = StoredData<AccessTokenResponse>;

/** Stored access token */
export type StoredRefreshToken = StoredData<string>;

export interface StoredAccessTokenMap {
  readonly access: StoredAccessToken;
  readonly refresh: StoredRefreshToken;
}

export interface AccessTokenStorage
  extends KeyableDataStorage<StoredAccessTokenMap>,
    Lockable {}

export interface AccessTokenStorageMessageType<T extends string> {
  readonly type: T;
  readonly timestamp: number;
  readonly from: Uuid;
  readonly to?: Uuid;
}

export type AccessTokenStorageMessage =
  AccessTokenStorageMessageType<'release'>;
