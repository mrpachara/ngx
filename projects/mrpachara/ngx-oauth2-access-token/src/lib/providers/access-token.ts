import {
  EnvironmentProviders,
  inject,
  InjectionToken,
  Injector,
  makeEnvironmentProviders,
  Provider,
} from '@angular/core';
import { libPrefix } from '../predefined';
import { AccessTokenService, Oauth2Client } from '../services';
import { AccessTokenIndexedDbStorage } from '../storages/indexed-db/access-token-indexed-db.storage';
import {
  ACCESS_TOKEN_CONFIG,
  ACCESS_TOKEN_SERVICES,
  ACCESS_TOKEN_STORAGE,
  OAUTH2_CLIENT_CONFIG,
  OAUTH2_CLIENT_ERROR_TRANSFORMER,
  STORAGE_NAME,
} from '../tokens';
import {
  AccessTokenConfig,
  AccessTokenStorage,
  Oauth2ClientConfig,
  Oauth2ClientErrorTransformer,
} from '../types';

/**
 * Provide AccessToken service.
 *
 * @param config Oauth2 client and access-token configuration
 * @param features
 * @returns
 */
export function provideAccessToken(
  config: Oauth2ClientConfig & AccessTokenConfig,
  ...features: readonly AccessTokenFeature[]
): EnvironmentProviders {
  const { description: name } = config.id;

  if (typeof name === 'undefined' || name.trim() === '') {
    throw new Error(`'id' MUST be assigned non-empty 'description'`);
  }

  const token = new InjectionToken<AccessTokenService>(
    `${libPrefix}-${name}-access-token-injector`,
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
              provide: OAUTH2_CLIENT_CONFIG,
              useValue: config,
            },
            {
              provide: ACCESS_TOKEN_CONFIG,
              useExisting: OAUTH2_CLIENT_CONFIG,
            },
            {
              provide: STORAGE_NAME,
              useFactory: () => inject(Oauth2Client).name,
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
            Oauth2Client,
            AccessTokenService,
          ],
        }).get(AccessTokenService),
    },
    {
      provide: ACCESS_TOKEN_SERVICES,
      multi: true,
      useExisting: token,
    },
    features
      .filter((feature) => !feature.internal)
      .map(({ providers }) => providers(token)),
  ]);
}

// ------------- Avaliable Features -----------------
export type AccessTokenFeature =
  | Oauth2ClientErrorTransformerFeature
  | AccessTokenStorageFeature
  | AccessTokenExtensionFeature;

// ------------- Enum -----------------
export enum AccessTokenFeatureKind {
  Oauth2ClientErrorTransformerFeature = 'OAUTH2_CLIENT:OAUTH2_CLIENT_ERROR_TRANSFORMER_FEATURE',
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
    : (token: InjectionToken<AccessTokenService>) => readonly Provider[];
}

// ------------- Features -----------------
export type Oauth2ClientErrorTransformerFeature = AccessTokenFeatureType<
  AccessTokenFeatureKind.Oauth2ClientErrorTransformerFeature,
  true
>;

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
 * Provide Oauth2 client error transformer.
 *
 * @param factory
 * @returns
 */
export function withOauth2ClientErrorTransformer(
  factory: () => Oauth2ClientErrorTransformer,
): Oauth2ClientErrorTransformerFeature {
  return {
    kind: AccessTokenFeatureKind.Oauth2ClientErrorTransformerFeature,
    internal: true,
    providers: [
      {
        provide: OAUTH2_CLIENT_ERROR_TRANSFORMER,
        useFactory: factory,
      },
    ],
  };
}

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
