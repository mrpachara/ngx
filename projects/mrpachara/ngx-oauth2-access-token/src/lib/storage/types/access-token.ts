import { AccessTokenResponse } from '../../types';
import { SingalDataStorage, StoredData } from './commons';

/** Stored access token */
export type StoredAccessToken = StoredData<AccessTokenResponse>;

export interface AccessTokenStorage
  extends SingalDataStorage<StoredAccessToken> {
  transaction<T>(projector: (storage: this) => Promise<T> | T): Promise<T>;
}
