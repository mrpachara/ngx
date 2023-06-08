import { InjectionToken, inject } from '@angular/core';

import {
  JwtEcdsaVerifier,
  JwtHmacVerifier,
  JwtRsassaVerifier,
} from '../jwt-verifiers';
import { JwkService } from '../services';
import { JwtVerifier } from '../types';

export type JwtInitializedState = {
  initialized: boolean;
};

export const JWK_SERVICES = new InjectionToken<JwkService[]>('jwk-services', {
  providedIn: 'root',
  factory: () => [],
});

export const DEFAULT_JWT_VERIFIERS = new InjectionToken<JwtVerifier[]>(
  'default-jwt-verifiers',
  {
    providedIn: 'root',
    factory: () => [
      inject(JwtHmacVerifier),
      inject(JwtRsassaVerifier),
      inject(JwtEcdsaVerifier),
    ],
  },
);

export const JWT_VERIFIERS = new InjectionToken<JwtVerifier[]>(
  'jwt-verifiers',
  {
    providedIn: 'root',
    factory: () => [],
  },
);
