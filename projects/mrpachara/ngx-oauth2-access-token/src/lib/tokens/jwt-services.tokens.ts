import { InjectionToken } from '@angular/core';

import { JwkService } from '../services';
import { JwtVerifier } from '../types';

/** The injection token for JWT services */
export const JWK_SERVICES = new InjectionToken<JwkService[]>('jwk-services', {
  providedIn: 'root',
  factory: () => [],
});

/** The injection token for scoped JWT verifiers */
export const JWT_VERIFIERS = new InjectionToken<JwtVerifier[]>(
  'jwt-verifiers',
  {
    providedIn: 'root',
    factory: () => [],
  },
);
