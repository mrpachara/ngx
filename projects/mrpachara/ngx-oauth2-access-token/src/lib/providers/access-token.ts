import {
  EnvironmentProviders,
  inject,
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
 * @param id Symbol for service
 * @param config Oauth2 client and access-token configuration
 * @param features
 * @returns
 */
export function provideAccessToken(
  id: symbol,
  config: Oauth2ClientConfig & AccessTokenConfig,
  ...features: readonly (Oauth2ClientFeature | AccessTokenFeature)[]
): EnvironmentProviders {
  if (typeof id.description === 'undefined') {
    throw new Error(`'id' MUST be assigned 'description'`);
  }

  return makeEnvironmentProviders([
    {
      provide: ACCESS_TOKEN_SERVICES,
      multi: true,
      useFactory: () =>
        Injector.create({
          name: `${libPrefix}-${id.description}-access-token-internal-injector`,
          parent: inject(Injector),
          providers: [
            {
              provide: OAUTH2_CLIENT_CONFIG,
              useValue: {
                ...config,
                id,
              },
            },
            {
              provide: ACCESS_TOKEN_CONFIG,
              useExisting: OAUTH2_CLIENT_CONFIG,
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
                AccessTokenFeatureKind.AccessTokenStorageFeature,
            )
              ? []
              : ([
                  {
                    provide: ACCESS_TOKEN_STORAGE,
                    useClass: AccessTokenIndexedDbStorage,
                  },
                ] satisfies Provider[]),
            Oauth2Client,
            AccessTokenService,
          ],
        }).get(AccessTokenService),
    },
  ]);
}

// ------------- Avaliable Features -----------------
export type Oauth2ClientFeature = Oauth2ClientErrorTransformerFeature;

export type AccessTokenFeature = AccessTokenStorageFeature;

// ------------- Enum -----------------
enum Oauth2ClientFeatureKind {
  Oauth2ClientErrorTransformerFeature = 'OAUTH2_CLIENT:OAUTH2_CLIENT_ERROR_TRANSFORMER_FEATURE',
}

enum AccessTokenFeatureKind {
  AccessTokenStorageFeature = 'ACCESS_TOKEN:ACCESS_TOKE_STORAGE_FEATURE',
}

// ------------- Type -----------------
interface Oauth2ClientFeatureType<K extends Oauth2ClientFeatureKind> {
  readonly kind: K;
  readonly providers: readonly Provider[];
}

interface AccessTokenFeatureType<K extends AccessTokenFeatureKind> {
  readonly kind: K;
  readonly providers: readonly Provider[];
}

// ------------- Oauth2Client: Features -----------------
export type Oauth2ClientErrorTransformerFeature =
  Oauth2ClientFeatureType<Oauth2ClientFeatureKind.Oauth2ClientErrorTransformerFeature>;

// ------------- AccessToken: Features -----------------
export type AccessTokenStorageFeature =
  AccessTokenFeatureType<AccessTokenFeatureKind.AccessTokenStorageFeature>;

// ------------- Oauth2Client: Feature Functions -----------------
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
    kind: Oauth2ClientFeatureKind.Oauth2ClientErrorTransformerFeature,
    providers: [
      {
        provide: OAUTH2_CLIENT_ERROR_TRANSFORMER,
        useFactory: factory,
      },
    ],
  };
}

// ------------- AccessToken: Feature Functions -----------------
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
    providers: [
      {
        provide: ACCESS_TOKEN_STORAGE,
        useFactory: factory,
      },
    ],
  };
}
