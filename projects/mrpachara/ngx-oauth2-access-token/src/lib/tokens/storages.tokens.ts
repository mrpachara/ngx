import { InjectionToken } from '@angular/core';

import { KeyValuePairStorage } from '../types';
import {
  AccessTokenStorageFactory,
  AuthorizationCodeStorageFactory,
} from '../storage';

export const KEY_VALUE_PAIR_STORAGE = new InjectionToken<KeyValuePairStorage>(
  'key-value-pair-storage',
);

export const ACCESS_TOKEN_STORAGE_FACTORY =
  new InjectionToken<AccessTokenStorageFactory>('access-token-storage-factory');

export const AUTHORIZATION_CODE_STORAGE_FACTORY =
  new InjectionToken<AuthorizationCodeStorageFactory>(
    'authorization-code-storage-factory',
  );
