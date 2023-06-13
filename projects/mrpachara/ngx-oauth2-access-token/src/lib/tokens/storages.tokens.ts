import { InjectionToken } from '@angular/core';

import { KeyValuePairStorageFactory } from '../types';
import {
  AccessTokenStorageFactory,
  AuthorizationCodeStorageFactory,
} from '../storage';
import { LocalStorageFactory } from '../storage/local-storage/local.storage.factory';

export const STORAGE_INFO = new InjectionToken<{
  name: string;
  version: number;
}>('storage-info');

export const KEY_VALUE_PAIR_STORAGE_FACTORY =
  new InjectionToken<KeyValuePairStorageFactory>(
    'key-value-pair-storage-factory',
    {
      providedIn: 'root',
      factory() {
        return new LocalStorageFactory();
      },
    },
  );

export const ACCESS_TOKEN_STORAGE_FACTORY =
  new InjectionToken<AccessTokenStorageFactory>('access-token-storage-factory');

export const AUTHORIZATION_CODE_STORAGE_FACTORY =
  new InjectionToken<AuthorizationCodeStorageFactory>(
    'authorization-code-storage-factory',
  );
