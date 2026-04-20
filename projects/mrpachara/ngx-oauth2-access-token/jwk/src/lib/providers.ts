import {
  EnvironmentProviders,
  InjectionToken,
  Injector,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import { TypeOfToken, libPrefix } from '@mrpachara/ngx-oauth2-access-token';
import { JwkDispatcher, JwkService } from './services';
import { JWK_CONFIG, JWK_SERVICES, JWT_VERIFIERS } from './tokens';
import { JwkConfigs, JwtVerifier } from './types';

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
  const token = new InjectionToken<JwkDispatcher>(
    `${libPrefix}-jwk-dispatcher:internal`,
  );

  return makeEnvironmentProviders([
    {
      provide: token,
      useFactory: () =>
        Injector.create({
          name: `${libPrefix}-jwk-dispatcher-injector:internal`,
          parent: inject(Injector),
          providers: [
            Object.entries(configs).map(([issuer, config]) => ({
              provide: JWK_SERVICES,
              multi: true,
              useFactory: () =>
                Injector.create({
                  name: `${libPrefix}-${issuer}-jwk-service-injector:internal`,
                  parent: inject(Injector),
                  providers: [
                    {
                      provide: JWK_CONFIG,
                      useValue: {
                        ...config,
                        issuer,
                      } satisfies TypeOfToken<typeof JWK_CONFIG>,
                    },
                    JwkService,
                  ],
                }).get(JwkService),
            })),
            jwtVerifiers.map((jwtVerifier) => ({
              provide: JWT_VERIFIERS,
              multi: true,
              useValue: jwtVerifier satisfies TypeOfToken<
                typeof JWT_VERIFIERS
              >[number],
            })),
            JwkDispatcher,
          ],
        }).get(JwkDispatcher),
    },
    {
      provide: JwkDispatcher,
      useExisting: token,
    },
  ]);
}
