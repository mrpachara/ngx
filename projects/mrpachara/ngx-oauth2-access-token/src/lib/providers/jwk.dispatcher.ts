import {
  EnvironmentProviders,
  inject,
  Injector,
  makeEnvironmentProviders,
} from '@angular/core';
import { libPrefix } from '../predefined';
import { JwkDispatcher, JwkService } from '../services';
import { JWK_CONFIG, JWK_SERVICES, JWT_VERIFIERS } from '../tokens';
import { JwkConfigs, JwtVerifier } from '../types';

/**
 * Provide JWK dispatcher.
 *
 * @param configs
 * @param jwtVerifiers
 * @returns
 */
export function provideJwkDispatcher(
  configs: JwkConfigs,
  jwtVerifiers: [JwtVerifier, ...JwtVerifier[]],
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
      provide: JWT_VERIFIERS,
      multi: true,
      useValue: jwtVerifier,
    })),

    JwkDispatcher,
  ]);
}
