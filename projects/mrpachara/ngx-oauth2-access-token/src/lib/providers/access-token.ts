import {
  EnvironmentProviders,
  inject,
  InjectionToken,
  Injector,
  makeEnvironmentProviders,
  Provider,
} from '@angular/core';
import { AccessTokenIndexedDbStorage } from '../../internal/storages';
import {
  ACCESS_TOKEN_SERVICE_HIERARCHIZED_TOKENS,
  ACCESS_TOKEN_SERVICE_TOKENS,
  provideHierarchization,
} from '../../internal/tokens';
import { libPrefix } from '../predefined';
import { AccessTokenService } from '../services';
import {
  ACCESS_TOKEN_CONFIG,
  ACCESS_TOKEN_ID,
  ACCESS_TOKEN_STORAGE,
  IdKey,
  STORAGE_NAME,
} from '../tokens';
import { AccessTokenConfig, AccessTokenStorage, TypeOfToken } from '../types';

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

  const storageNameToken = new InjectionToken<string>(
    `${libPrefix}-storageName:${id}`,
  );

  const token = new InjectionToken<AccessTokenService>(
    `${libPrefix}-access-token-injector:${id}`,
  );

  return makeEnvironmentProviders([
    {
      provide: storageNameToken,
      useValue: `${id}` satisfies TypeOfToken<typeof storageNameToken>,
    },
    {
      provide: token,
      useFactory: () =>
        Injector.create({
          name: `${token}:internal`,
          parent: inject(Injector),
          providers: [
            {
              provide: ACCESS_TOKEN_CONFIG,
              useValue: config satisfies TypeOfToken<
                typeof ACCESS_TOKEN_CONFIG
              >,
            },
            {
              provide: STORAGE_NAME,
              useExisting: storageNameToken satisfies typeof STORAGE_NAME,
            },
            {
              provide: ACCESS_TOKEN_STORAGE,
              useClass: AccessTokenIndexedDbStorage,
            },
            features
              .filter(
                (feature) =>
                  feature.kind ===
                  AccessTokenFeatureKind.AccessTokenInternalFeature,
              )
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
    provideHierarchization(
      ACCESS_TOKEN_SERVICE_HIERARCHIZED_TOKENS,
      ACCESS_TOKEN_SERVICE_TOKENS,
      () => ({
        id,
        token,
      }),
    ),
    features
      .filter(
        (feature) =>
          feature.kind === AccessTokenFeatureKind.AccessTokenExtensionFeature,
      )
      .map(({ providers }) =>
        providers({
          id,
          storageNameToken,
          accessTokenServiceToken: token,
        }),
      ),
    {
      provide: ACCESS_TOKEN_ID,
      useValue: id satisfies TypeOfToken<typeof ACCESS_TOKEN_ID>,
    },
    {
      provide: STORAGE_NAME,
      useExisting: storageNameToken satisfies typeof STORAGE_NAME,
    },
    {
      provide: AccessTokenService,
      useExisting: token satisfies InjectionToken<AccessTokenService>,
    },
  ]);
}

// ------------- Avaliable Features -----------------
export type AccessTokenFeature =
  | StorageNameFeature
  | AccessTokenStorageFeature
  | AccessTokenExtensionFeature;

// ------------- Enum -----------------
export enum AccessTokenFeatureKind {
  AccessTokenInternalFeature = 'ACCESS_TOKEN:ACCESS_TOKEN_INTERNAL_FEATURE',
  AccessTokenExtensionFeature = 'ACCESS_TOKEN:ACCESS_TOKEN_EXTENSION_FEATURE',
}

// ------------- Type -----------------
export interface AccessTokenFeatureType<K extends AccessTokenFeatureKind> {
  readonly kind: K;
  readonly providers: K extends AccessTokenFeatureKind.AccessTokenInternalFeature
    ? readonly Provider[]
    : (context: {
        // NOTE: `id` is needed to prevent **circular reference** of extractor
        readonly id: IdKey;
        readonly storageNameToken: InjectionToken<string>;
        readonly accessTokenServiceToken: InjectionToken<AccessTokenService>;
      }) => readonly Provider[];
}

// ------------- Features -----------------
export type AccessTokenStorageFeature =
  AccessTokenFeatureType<AccessTokenFeatureKind.AccessTokenInternalFeature>;

export type StorageNameFeature =
  AccessTokenFeatureType<AccessTokenFeatureKind.AccessTokenExtensionFeature>;

export type AccessTokenExtensionFeature =
  AccessTokenFeatureType<AccessTokenFeatureKind.AccessTokenExtensionFeature>;

// ------------- Feature Functions -----------------
/**
 * Provide _access token_ storage.
 *
 * @param factory
 * @returns
 */
export function withAccessTokenStorage(
  factory: () => AccessTokenStorage,
): AccessTokenStorageFeature {
  return {
    kind: AccessTokenFeatureKind.AccessTokenInternalFeature,
    providers: [
      {
        provide: ACCESS_TOKEN_STORAGE,
        useFactory: factory,
      },
    ],
  };
}

/**
 * Provide storage name.
 *
 * @param factory
 * @returns
 */
export function withStorageName(name: string): StorageNameFeature {
  return {
    kind: AccessTokenFeatureKind.AccessTokenExtensionFeature,
    providers: ({ storageNameToken }) => [
      {
        provide: storageNameToken,
        useValue: name satisfies TypeOfToken<typeof storageNameToken>,
      },
    ],
  };
}
