import { InjectionToken } from '@angular/core';

import { KeyValuePairStorage } from '../types';
import {
  AccessTokenStorageFactory,
  AuthorizationCodeStorageFactory,
} from '../storage';
import { LocalStorage } from '../storage/local-storage/local.storage';

export const STORAGE_VERSION = new InjectionToken<bigint>('storage-version');

export const KEY_VALUE_PAIR_STORAGE = new InjectionToken<KeyValuePairStorage>(
  'key-value-pair-storage',
  {
    providedIn: 'root',
    factory() {
      return new LocalStorage();
    },
  },
);

export const ACCESS_TOKEN_STORAGE_FACTORY =
  new InjectionToken<AccessTokenStorageFactory>('access-token-storage-factory');

export const AUTHORIZATION_CODE_STORAGE_FACTORY =
  new InjectionToken<AuthorizationCodeStorageFactory>(
    'authorization-code-storage-factory',
  );
