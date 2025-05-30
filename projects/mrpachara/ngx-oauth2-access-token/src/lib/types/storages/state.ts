import { StoredData } from './commons';

export interface StoredStateData<T> extends StoredData<T> {
  readonly codeVerifier?: string;
}

export interface StateStorage {
  load<T = unknown>(state: string): Promise<StoredStateData<T> | undefined>;
  store<T = unknown>(
    state: string,
    data: StoredStateData<T>,
  ): Promise<StoredStateData<T>>;
  remove<T = unknown>(state: string): Promise<StoredStateData<T> | undefined>;
  removeExpired(): Promise<void>;
}
