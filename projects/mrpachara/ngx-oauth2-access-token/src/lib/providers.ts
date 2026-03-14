import {
  ClassSansProvider,
  EnvironmentProviders,
  ExistingSansProvider,
  FactorySansProvider,
  inject,
  InjectionToken,
  Injector,
  makeEnvironmentProviders,
  Provider,
  Type,
  ValueSansProvider,
} from '@angular/core';
import {
  AccessTokenIndexedDbStorage,
  StateIndexedDbStorage,
} from '../internal/storages';
import {
  ACCESS_TOKEN_SERVICE_HIERARCHIZED_TOKENS,
  ACCESS_TOKEN_SERVICE_TOKENS,
  AUTHORIZATION_CODE_SERVICE_HIERARCHIZED_TOKENS,
  AUTHORIZATION_CODE_SERVICE_TOKENS,
  provideHierarchization,
} from '../internal/tokens';
import { libPrefix } from './predefined';
import { AccessTokenService, AuthorizationCodeService } from './services';
import {
  ACCESS_TOKEN_CONFIG,
  ACCESS_TOKEN_ID,
  ACCESS_TOKEN_STORAGE,
  AUTHORIZATION_CODE_CONFIG,
  AUTHORIZATION_CODE_STORAGE,
  STORAGE_NAME,
} from './tokens';
import {
  AccessTokenConfig,
  AccessTokenStorage,
  AuthorizationCodeConfig,
  AuthorizationCodeStorage,
  TypeOfToken,
} from './types';

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
                  feature.kind === FeatureKind.DeferredTokenStorageFeature,
              )
              .map((feature) =>
                feature.providers.map((provider) => ({
                  ...provider,
                  provide: ACCESS_TOKEN_STORAGE,
                })),
              ),
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
      .filter((feature) => feature.kind === FeatureKind.ExtensionFeature)
      .map(({ providers }) =>
        providers({
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
type AccessTokenFeature =
  | StorageNameFeature
  | DeferredTokenStorageFeature<AccessTokenStorage>
  | ExtensionFeature;

// ------------- Enum -----------------
enum FeatureKind {
  DeferredTokenStorageFeature = 'DEFERRED_TOKEN_STORAGE_FEATURE',
  ExtensionFeature = 'EXTENSION_FEATURE',
}

// ------------- Type -----------------
interface DeferredTokenStorageFeatureType<T> {
  readonly kind: FeatureKind.DeferredTokenStorageFeature;
  readonly providers: readonly (
    | (ValueSansProvider & { useValue: T })
    | (ClassSansProvider & { useClass: Type<T> })
    | (ExistingSansProvider & { useExisting: InjectionToken<T> | Type<T> })
    | (FactorySansProvider & { useFactory: (...args: unknown[]) => T })
  )[];
}

interface ExtensionFeatureType {
  readonly kind: FeatureKind.ExtensionFeature;
  readonly providers: (context: {
    readonly storageNameToken: InjectionToken<string>;
    readonly accessTokenServiceToken: InjectionToken<AccessTokenService>;
  }) => readonly Provider[];
}

// ------------- Features -----------------
type StorageNameFeature = ExtensionFeatureType;

type DeferredTokenStorageFeature<T> = DeferredTokenStorageFeatureType<T>;

type ExtensionFeature = ExtensionFeatureType;

// ------------- Feature Functions -----------------
/**
 * Provide storage name.
 *
 * @param factory
 * @returns
 */
export function withStorageName(name: string): StorageNameFeature {
  return {
    kind: FeatureKind.ExtensionFeature,
    providers: ({ storageNameToken }) => [
      {
        provide: storageNameToken,
        useValue: name satisfies TypeOfToken<typeof storageNameToken>,
      },
    ],
  };
}

/**
 * Provide storage.
 *
 * @param factory
 * @returns
 */
export function withStorage<T>(
  factory: () => T,
): DeferredTokenStorageFeature<T> {
  return {
    kind: FeatureKind.DeferredTokenStorageFeature,
    providers: [
      {
        useFactory: factory,
      },
    ],
  };
}

/**
 * Provide authorization-code.
 *
 * @param config
 * @param featrues
 * @returns
 */
export function withAuthorizationCode(
  config: AuthorizationCodeConfig,
  ...features: AuthorizationCodeFeature[]
): ExtensionFeature {
  return {
    kind: FeatureKind.ExtensionFeature,
    providers: ({ accessTokenServiceToken, storageNameToken }) => {
      const token = new InjectionToken<AuthorizationCodeService>(
        `${accessTokenServiceToken}:authorization-code`,
      );

      return [
        {
          provide: token,
          useFactory: () =>
            Injector.create({
              name: `${token}:internal`,
              parent: inject(Injector),
              providers: [
                {
                  provide: AccessTokenService,
                  useExisting:
                    accessTokenServiceToken satisfies InjectionToken<AccessTokenService>,
                },
                {
                  provide: AUTHORIZATION_CODE_CONFIG,
                  useValue: config satisfies TypeOfToken<
                    typeof AUTHORIZATION_CODE_CONFIG
                  >,
                },
                {
                  provide: STORAGE_NAME,
                  useExisting: storageNameToken satisfies typeof STORAGE_NAME,
                },
                {
                  provide: AUTHORIZATION_CODE_STORAGE,
                  useClass: StateIndexedDbStorage,
                },
                features
                  .filter(
                    (feature) =>
                      feature.kind === FeatureKind.DeferredTokenStorageFeature,
                  )
                  .map((feature) =>
                    feature.providers.map((provider) => ({
                      ...provider,
                      provide: AUTHORIZATION_CODE_STORAGE,
                    })),
                  ),
                AuthorizationCodeService,
              ],
            }).get(AuthorizationCodeService),
        },
        provideHierarchization(
          AUTHORIZATION_CODE_SERVICE_HIERARCHIZED_TOKENS,
          AUTHORIZATION_CODE_SERVICE_TOKENS,
          () => ({
            id: inject(accessTokenServiceToken).id,
            token,
          }),
        ),
        {
          provide: AuthorizationCodeService,
          useExisting: token satisfies InjectionToken<AuthorizationCodeService>,
        },
      ];
    },
  };
}
// ------------- Avaliable Features -----------------
type AuthorizationCodeFeature =
  DeferredTokenStorageFeature<AuthorizationCodeStorage>;
