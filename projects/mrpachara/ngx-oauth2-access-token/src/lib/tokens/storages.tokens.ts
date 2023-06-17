import { InjectionToken, Type } from '@angular/core';

import { KeyValuePairsStorageFactory } from '../types';
import { IndexedDbStorageFactory } from '../storage/indexed-db-storage/indexed-db.storage.factory';
import { LocalStorageFactory } from '../storage/local-storage/local.storage.factory';
import { FallbackableStorageFactory } from '../storage/fallbackable-storage/fallbackable.storage.factory';

export const STORAGE_INFO = new InjectionToken<{
  name: string;
  version: number;
}>('storage-info');

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
