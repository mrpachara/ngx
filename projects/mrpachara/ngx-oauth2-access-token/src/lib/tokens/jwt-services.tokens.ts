import { InjectionToken } from '@angular/core';

import { JwtVerifier } from '../types';
import { JwkService } from '../jwk.service';

export type JwtInitializedState = {
  initialized: boolean;
};

export const JWT_INITIALIZED_STATE = new InjectionToken<JwtInitializedState>(
  'jwt-initialized-state',
  {
    providedIn: 'root',
    factory: () =>
      ({
        initialized: false,
      } as JwtInitializedState),
  },
);

export const JWK_SERVICES = new InjectionToken<JwkService[]>('jwk-services', {
  providedIn: 'root',
  factory: () => [],
});

export const JWT_VERIFIERS = new InjectionToken<JwtVerifier[]>(
  'jwt-verifiers',
  {
    providedIn: 'root',
    factory: () => [],
  },
);
