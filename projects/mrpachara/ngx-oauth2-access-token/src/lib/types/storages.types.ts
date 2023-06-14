import { Observable } from 'rxjs';

export interface KeyValuePairStorage {
  readonly name: string;

  loadItem<T = unknown>(key: string): Promise<T | null>;
  storeItem<T = unknown>(key: string, value: T): Promise<T>;
  removeItem<T = unknown>(key: string): Promise<T | null>;

  /**
   * Return a _multicast observable_ for changing value of the given `key`. The
   * `null` value means the key was removed.
   */
  watchItem<T = unknown>(key: string): Observable<T | null>;

  /** Return all keys from the storage. */
  keys(): Promise<string[]>;
}

export interface KeyValuePairStorageFactory {
  supported(): Promise<void>;
  get(storageName: string): KeyValuePairStorage;
}
