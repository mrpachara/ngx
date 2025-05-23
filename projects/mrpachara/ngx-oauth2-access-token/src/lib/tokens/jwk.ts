import { InjectionToken } from '@angular/core';
import { JwkService } from '../services';
import { JwkConfig, SignedJsonWebVerifier } from '../types';

/** The injection token for jwk service config */
export const JWK_CONFIG = new InjectionToken<JwkConfig>('jwk-config');

/** The injection token for JWK services */
export const JWK_SERVICES = new InjectionToken<JwkService[]>('jwk-services', {
  providedIn: 'root',
  factory: () => [],
});

/** The injection token for scoped JWT verifiers */
export const SIGNED_JSON_WEB_VERIFIERS = new InjectionToken<
  SignedJsonWebVerifier[]
>('singed-json-web-verifiers', {
  providedIn: 'root',
  factory: () => [],
});
