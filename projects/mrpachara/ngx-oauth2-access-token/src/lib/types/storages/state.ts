import { StoredData } from './commons';

export interface StoredStateData<T> extends StoredData<T> {
  readonly codeVerifier?: string;
}

export interface StateStorage {
  load<T = unknown>(key: string): Promise<StoredStateData<T> | undefined>;
  store<T = unknown>(
    key: string,
    data: StoredStateData<T>,
  ): Promise<StoredStateData<T>>;
  remove<T = unknown>(key: string): Promise<StoredStateData<T> | undefined>;
  removeExpired(): Promise<void>;
}
