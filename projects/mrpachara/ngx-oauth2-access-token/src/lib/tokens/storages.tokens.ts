import { InjectionToken } from '@angular/core';

import {
  AccessTokenStorageFactory,
  AuthorizationCodeStorageFactory,
} from '../types';

export const ACCESS_TOKEN_STORAGE_FACTORY =
  new InjectionToken<AccessTokenStorageFactory>('access-token-storage-factory');

export const AUTHORIZATION_CODE_STORAGE_FACTORY =
  new InjectionToken<AuthorizationCodeStorageFactory>(
    'authorization-code-storage-factory',
  );
