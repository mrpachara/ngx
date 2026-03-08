import {
  EnvironmentProviders,
  inject,
  InjectionToken,
  Injector,
  makeEnvironmentProviders,
  Provider,
} from '@angular/core';
import { libPrefix } from '../predefined';
import { AccessTokenService } from '../services';
import { AccessTokenIndexedDbStorage } from '../storages';
import {
  ACCESS_TOKEN_CONFIG,
  ACCESS_TOKEN_SERVICE_HIERARCHIZED_TOKENS,
  ACCESS_TOKEN_SERVICE_TOKENS,
  ACCESS_TOKEN_STORAGE,
  IdKey,
  STORAGE_NAME,
} from '../tokens';
import { AccessTokenConfig, AccessTokenStorage } from '../types';

/**
 * Provide AccessToken service.
 *
 * @param config _access token_ configuration
 * @param features
 * @returns
 */
export function provideAccessToken<N extends string>(
  config: AccessTokenConfig<N>,
  ...features: readonly AccessTokenFeature[]
): EnvironmentProviders {
  const { id } = config;

  const token = new InjectionToken<AccessTokenService>(
    `${libPrefix}-${id}-access-token-injector`,
  );

  return makeEnvironmentProviders([
    {
      provide: token,
      useFactory: () =>
        Injector.create({
          name: `${libPrefix}-${name}-access-token-internal-injector`,
          parent: inject(Injector),
          providers: [
            {
              provide: ACCESS_TOKEN_CONFIG,
              useValue: config,
            },
            {
              provide: STORAGE_NAME,
              useFactory: () => `${inject(ACCESS_TOKEN_CONFIG).id}`,
            },
            {
              provide: ACCESS_TOKEN_STORAGE,
              useClass: AccessTokenIndexedDbStorage,
            },
            features
              .filter((feature) => feature.internal)
              .map((feature) => {
                switch (feature.kind) {
                  default: {
                    return [...feature.providers];
                  }
                }
              }),
            AccessTokenService,
          ],
        }).get(AccessTokenService),
    },
    {
      provide: ACCESS_TOKEN_SERVICE_TOKENS,
      multi: true,
      useValue: { id, token } as const,
    },
    {
      provide: ACCESS_TOKEN_SERVICE_HIERARCHIZED_TOKENS,
      useFactory: () => [
        ...(inject(ACCESS_TOKEN_SERVICE_HIERARCHIZED_TOKENS, {
          skipSelf: true,
          optional: true,
        }) ?? []),
        ...inject(ACCESS_TOKEN_SERVICE_TOKENS),
      ],
    },
    {
      provide: AccessTokenService,
      useExisting: token,
    },
    features
      .filter((feature) => !feature.internal)
      .map(({ providers }) => providers(id, token)),
  ]);
}

// ------------- Avaliable Features -----------------
export type AccessTokenFeature =
  | AccessTokenStorageFeature
  | AccessTokenExtensionFeature;

// ------------- Enum -----------------
export enum AccessTokenFeatureKind {
  AccessTokenStorageFeature = 'ACCESS_TOKEN:ACCESS_TOKEN_STORAGE_FEATURE',
  AccessTokenExtensionFeature = 'ACCESS_TOKEN:ACCESS_TOKEN_EXTENSION_FEATURE',
}

// ------------- Type -----------------
export interface AccessTokenFeatureType<
  K extends AccessTokenFeatureKind,
  E extends boolean,
> {
  readonly kind: K;
  readonly internal: E;
  readonly providers: E extends true
    ? readonly Provider[]
    : (
        id: IdKey,
        accessTokenServiceToken: InjectionToken<AccessTokenService>,
      ) => readonly Provider[];
}

// ------------- Features -----------------
export type AccessTokenStorageFeature = AccessTokenFeatureType<
  AccessTokenFeatureKind.AccessTokenStorageFeature,
  true
>;

export type AccessTokenExtensionFeature = AccessTokenFeatureType<
  AccessTokenFeatureKind.AccessTokenExtensionFeature,
  false
>;

// ------------- Feature Functions -----------------
/**
 * Provide access-token storage.
 *
 * @param factory
 * @returns
 */
export function withAccessTokenStorage(
  factory: () => AccessTokenStorage,
): AccessTokenStorageFeature {
  return {
    kind: AccessTokenFeatureKind.AccessTokenStorageFeature,
    internal: true,
    providers: [
      {
        provide: ACCESS_TOKEN_STORAGE,
        useFactory: factory,
      },
    ],
  };
}
