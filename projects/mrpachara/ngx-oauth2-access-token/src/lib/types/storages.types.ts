import { Observable } from 'rxjs';
import { DeepReadonly } from './utils.type';

export interface KeyValuePairStorage {
  readonly name: string;

  loadItem<T = unknown>(key: string): Promise<DeepReadonly<T | null>>;
  storeItem<T = unknown>(key: string, value: T): Promise<DeepReadonly<T>>;
  removeItem<T = unknown>(key: string): Promise<DeepReadonly<T | null>>;

  /**
   * Return a _multicast observable_ for changing value of the given `key`. The
   * `null` value means the key was removed.
   */
  watchItem<T = unknown>(key: string): Observable<DeepReadonly<T | null>>;

  /** Return all keys from the storage. */
  keys(): Promise<string[]>;
}

export interface KeyValuePairStorageFactory {
  supported(): Promise<void>;
  get(storageName: string): KeyValuePairStorage;
}
