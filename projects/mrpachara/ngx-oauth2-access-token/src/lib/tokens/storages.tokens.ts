import { InjectionToken, Type } from '@angular/core';

import { KeyValuePairsStorageFactory } from '../types';
import { IndexedDbStorageFactory } from '../storage/indexed-db-storage/indexed-db.storage.factory';
import { LocalStorageFactory } from '../storage/local-storage/local.storage.factory';
import { FallbackableStorageFactory } from '../storage/fallbackable-storage/fallbackable.storage.factory';

/** The injection token for storage information */
export const STORAGE_INFO = new InjectionToken<{
  name: string;
  version: number;
}>('storage-info');

/** The injection token for key-value pairs storage factory */
export const KEY_VALUE_PAIR_STORAGE_FACTORY =
  new InjectionToken<KeyValuePairsStorageFactory>(
    'key-value-pairs-storage-factory',
    {
      providedIn: 'root',
      factory() {
        return new FallbackableStorageFactory();
      },
    },
  );

/**
 * The injection token for fallbackable key-value pairs storage factory tokens.
 * It only be used for `FallbackableStorageFactory`.
 */
export const FALLBACKABLE_KEY_VALUE_PAIR_STORAGE_FACTORY_TOKENS =
  new InjectionToken<
    (
      | Type<KeyValuePairsStorageFactory>
      | InjectionToken<KeyValuePairsStorageFactory>
    )[]
  >('fallbackable-key-value-pairs-storage-factory-token', {
    providedIn: 'root',
    factory: () => [IndexedDbStorageFactory, LocalStorageFactory],
  });
