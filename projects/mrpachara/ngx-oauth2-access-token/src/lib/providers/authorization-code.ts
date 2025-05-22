import {
  EnvironmentProviders,
  inject,
  Injector,
  makeEnvironmentProviders,
  Provider,
} from '@angular/core';
import { libPrefix } from '../predefined';
import { AccessTokenService, AuthorizationCodeService } from '../services';
import { StateIndexedDbStorage } from '../storages/indexed-db/state-indexed-db.storage';
import {
  AUTHORIZATION_CODE_CONFIG,
  AUTHORIZATION_CODE_SERVICES,
  AUTHORIZATION_CODE_STORAGE,
  injectAccessTokenService,
  STORAGE_NAME,
} from '../tokens';
import { AuthorizationCodeConfig, StateStorage } from '../types';

/**
 * Provide AuthorizationCode service.
 *
 * @param id Symbol for service
 * @param config Authorization-code configuration
 * @param features
 * @returns
 */
export function provideAuthorizationCode(
  id: symbol,
  config: AuthorizationCodeConfig,
  ...features: readonly AuthorizationCodeFeature[]
): EnvironmentProviders {
  if (typeof id.description === 'undefined') {
    throw new Error(`'id' MUST be assigned 'description'`);
  }

  return makeEnvironmentProviders([
    {
      provide: AUTHORIZATION_CODE_SERVICES,
      multi: true,
      useFactory: () =>
        Injector.create({
          name: `${libPrefix}-${id.description}-authorization-code-internal-injector`,
          parent: inject(Injector),
          providers: [
            {
              provide: AUTHORIZATION_CODE_CONFIG,
              useValue: {
                ...config,
                id,
              },
            },
            {
              provide: STORAGE_NAME,
              useValue: id.description,
            },
            features.map((feature) => {
              switch (feature.kind) {
                default: {
                  return [...feature.providers];
                }
              }
            }),
            features.some(
              (feature) =>
                feature.kind ===
                AuthorizationCodeFeatureKind.AuthorizationCodeStorageFeature,
            )
              ? []
              : ([
                  {
                    provide: AUTHORIZATION_CODE_STORAGE,
                    useClass: StateIndexedDbStorage,
                  },
                ] satisfies Provider[]),
            {
              provide: AccessTokenService,
              useFactory: () => injectAccessTokenService(id),
            },
            AuthorizationCodeService,
          ],
        }).get(AuthorizationCodeService),
    },
  ]);
}

// ------------- Avaliable Features -----------------
export type AuthorizationCodeFeature = AuthorizationCodeStorageFeature;

// ------------- Enum -----------------
enum AuthorizationCodeFeatureKind {
  AuthorizationCodeStorageFeature = 'AUTHORIZATION_CODE:AUTHORIZATION_CODE_STORAGE_FEATURE',
}

// ------------- Type -----------------
interface AuthorizationCodeFeatureType<K extends AuthorizationCodeFeatureKind> {
  readonly kind: K;
  readonly providers: readonly Provider[];
}
// ------------- Features -----------------
export type AuthorizationCodeStorageFeature =
  AuthorizationCodeFeatureType<AuthorizationCodeFeatureKind.AuthorizationCodeStorageFeature>;

// ------------- Feature Functions -----------------
/**
 * Provide authorization-code storage.
 *
 * @param factory
 * @returns
 */
export function withAuthorizationCodeStorage(
  factory: () => StateStorage,
): AuthorizationCodeStorageFeature {
  return {
    kind: AuthorizationCodeFeatureKind.AuthorizationCodeStorageFeature,
    providers: [
      {
        provide: AUTHORIZATION_CODE_STORAGE,
        useFactory: factory,
      },
    ],
  };
}
