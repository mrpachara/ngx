import { InjectionToken } from '@angular/core';
import { JwkService } from '../services';
import { JwkConfig, JwtVerifier } from '../types';

/** The injection token for jwk service config */
export const JWK_CONFIG = new InjectionToken<JwkConfig>('jwk-config');

/** The injection token for JWK services */
export const JWK_SERVICES = new InjectionToken<JwkService[]>('jwk-services', {
  providedIn: 'root',
  factory: () => [],
});

/** The injection token for JWT verifiers */
export const JWT_VERIFIERS = new InjectionToken<JwtVerifier[]>(
  'jwt-verifiers',
  {
    providedIn: 'root',
    factory: () => [],
  },
);
