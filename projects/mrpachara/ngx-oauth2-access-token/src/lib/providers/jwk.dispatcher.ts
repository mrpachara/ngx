import {
  EnvironmentProviders,
  inject,
  Injector,
  makeEnvironmentProviders,
} from '@angular/core';
import { libPrefix } from '../predefined';
import { JwkDispatcher, JwkService } from '../services';
import { JWK_CONFIG, JWK_SERVICES, SIGNED_JSON_WEB_VERIFIERS } from '../tokens';
import { JwkConfigs, SignedJsonWebVerifier } from '../types';

/**
 * Provide JWK dispatcher.
 *
 * @param configs
 * @param jwtVerifiers
 * @returns
 */
export function provideJwkDispatcher(
  configs: JwkConfigs,
  jwtVerifiers: [SignedJsonWebVerifier, ...SignedJsonWebVerifier[]],
): EnvironmentProviders {
  return makeEnvironmentProviders([
    Object.entries(configs).map(([issuer, config]) => ({
      provide: JWK_SERVICES,
      multi: true,
      useFactory: () =>
        Injector.create({
          name: `${libPrefix}-${issuer}-jwk-internal-injector`,
          parent: inject(Injector),
          providers: [
            {
              provide: JWK_CONFIG,
              useValue: {
                ...config,
                issuer,
              },
            },
            JwkService,
          ],
        }).get(JwkService),
    })),

    jwtVerifiers.map((jwtVerifier) => ({
      provide: SIGNED_JSON_WEB_VERIFIERS,
      multi: true,
      useValue: jwtVerifier,
    })),

    JwkDispatcher,
  ]);
}
