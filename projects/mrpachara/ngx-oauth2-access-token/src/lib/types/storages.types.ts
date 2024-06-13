import { Observable } from 'rxjs';

import { DeepReadonly } from './utils.type';

/** The interface for key-value pairs storage */
export interface KeyValuePairsStorage {
  /** The name of storage */
  readonly name: string;

  /**
   * Load item.
   *
   * @param key The key for loading
   * @returns The `Promise` of immualbe item
   */
  loadItem<T = unknown>(key: string): Promise<DeepReadonly<T | null>>;

  /**
   * Store item.
   *
   * @param key The key for storing
   * @param value The item to be stored
   * @returns The `Promise` of immualbe item
   */
  storeItem<T = unknown>(key: string, value: T): Promise<DeepReadonly<T>>;

  /**
   * Remove item
   *
   * @param key The key for removing
   * @returns The `Promise` of immualbe item or `null` when not found
   */
  removeItem<T = unknown>(key: string): Promise<DeepReadonly<T | null>>;

  /**
   * Watch the changing of stored item. It returns the _multicast observable_
   * for observing value of the given `key`. Emitting `null` value means the
   * value was removed.
   *
   * @param key The key of value for watching
   * @returns The `Observable` of immuable item
   */
  watchItem<T = unknown>(key: string): Observable<DeepReadonly<T | null>>;

  /**
   * Return all keys from the storage.
   *
   * @returns The `Promise` of array keys
   */
  keys(): Promise<string[]>;
}

/** The interface of key-value pairs storage factory */
export interface KeyValuePairsStorageFactory {
  /**
   * Check for supporing of the storage type. It always resolve with `void` but
   * **reject/throw** with an error when the storage type **was not**
   * supported.
   */
  supported(): Promise<void>;

  /**
   * Get the storage from the given `storageName`.
   *
   * @param storageName The storage name
   */
  get(storageName: string): KeyValuePairsStorage;
}
