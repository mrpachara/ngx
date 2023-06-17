import { InjectionToken, inject } from '@angular/core';

import {
  JwtEcdsaVerifier,
  JwtEddsaVerifier,
  JwtHmacVerifier,
  JwtRsassaVerifier,
} from '../jwt-verifiers';
import { JwkService } from '../services';
import { JwtVerifier } from '../types';

/** The injection token for JWT services */
export const JWK_SERVICES = new InjectionToken<JwkService[]>('jwk-services', {
  providedIn: 'root',
  factory: () => [],
});

/** The injection token for default JWT verifiers */
export const DEFAULT_JWT_VERIFIERS = new InjectionToken<JwtVerifier[]>(
  'default-jwt-verifiers',
  {
    providedIn: 'root',
    factory: () => [
      inject(JwtHmacVerifier),
      inject(JwtRsassaVerifier),
      inject(JwtEcdsaVerifier),
      inject(JwtEddsaVerifier),
    ],
  },
);

/** The injection token for scoped JWT verifiers */
export const JWT_VERIFIERS = new InjectionToken<JwtVerifier[]>(
  'jwt-verifiers',
  {
    providedIn: 'root',
    factory: () => [],
  },
);
