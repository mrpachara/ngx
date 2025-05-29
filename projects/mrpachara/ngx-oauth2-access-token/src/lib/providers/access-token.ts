import {
  EnvironmentProviders,
  ExistingProvider,
  inject,
  InjectionToken,
  Injector,
  makeEnvironmentProviders,
  Provider,
} from '@angular/core';
import { libPrefix } from '../predefined';
import {
  AccessTokenService,
  AuthorizationCodeService,
  Oauth2Client,
} from '../services';
import { StateIndexedDbStorage } from '../storages';
import { AccessTokenIndexedDbStorage } from '../storages/indexed-db/access-token-indexed-db.storage';
import {
  ACCESS_TOKEN_CONFIG,
  ACCESS_TOKEN_SERVICES,
  ACCESS_TOKEN_STORAGE,
  AUTHORIZATION_CODE_CONFIG,
  AUTHORIZATION_CODE_SERVICES,
  AUTHORIZATION_CODE_STORAGE,
  OAUTH2_CLIENT_CONFIG,
  OAUTH2_CLIENT_ERROR_TRANSFORMER,
  STORAGE_NAME,
} from '../tokens';
import {
  AccessTokenConfig,
  AccessTokenStorage,
  AuthorizationCodeConfig,
  Oauth2ClientConfig,
  Oauth2ClientErrorTransformer,
  RequiredOnly,
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
  config: Oauth2ClientConfig & AccessTokenConfig,
  ...features: readonly AccessTokenFeature[]
): EnvironmentProviders {
  const { description: name } = config.id;

  if (typeof name === 'undefined' || name.trim() === '') {
    throw new Error(`'id' MUST be assigned non-empty 'description'`);
  }

  const selfToken = new InjectionToken<AccessTokenService>(
    `${libPrefix}-${name}-access-token-self-injector`,
  );

  return makeEnvironmentProviders([
    {
      provide: selfToken,
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
              .filter(({ scoped }) => scoped)
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
      useExisting: selfToken,
    },
    features
      .map(({ token }) => token)
      .filter((token) => typeof token !== 'undefined')
      .map(
        (token) =>
          ({
            provide: token,
            useExisting: selfToken,
          }) satisfies ExistingProvider,
      ),
    features.filter(({ scoped }) => !scoped).map(({ providers }) => providers),
  ]);
}

// ------------- Avaliable Features -----------------
export type AccessTokenFeature =
  | Oauth2ClientErrorTransformerFeature
  | AccessTokenStorageFeature
  | AuthorizationCodeFeature;

// ------------- Enum -----------------
enum AccessTokenFeatureKind {
  Oauth2ClientErrorTransformerFeature = 'OAUTH2_CLIENT:OAUTH2_CLIENT_ERROR_TRANSFORMER_FEATURE',
  AccessTokenStorageFeature = 'ACCESS_TOKEN:ACCESS_TOKE_STORAGE_FEATURE',
  AuthorizationCodeFeature = 'ACCESS_TOKEN:AUTHORIZATION_CODE_FEATURE',
}

// ------------- Type -----------------
interface AccessTokenFeatureType<
  K extends AccessTokenFeatureKind,
  E extends boolean,
> {
  readonly kind: K;
  readonly scoped: E;
  readonly token?: E extends true ? never : InjectionToken<AccessTokenService>;
  readonly providers: readonly Provider[];
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

export type AuthorizationCodeFeature = RequiredOnly<
  AccessTokenFeatureType<
    AccessTokenFeatureKind.AuthorizationCodeFeature,
    false
  >,
  'token'
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
    scoped: true,
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
    scoped: true,
    providers: [
      {
        provide: ACCESS_TOKEN_STORAGE,
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
export function withAuthorizationCode(
  config: AuthorizationCodeConfig,
): AuthorizationCodeFeature {
  const token = new InjectionToken<AccessTokenService>(
    `${libPrefix}-${AccessTokenFeatureKind.AuthorizationCodeFeature}-access-token-self-injector`,
  );

  return {
    kind: AccessTokenFeatureKind.AuthorizationCodeFeature,
    scoped: false,
    token,
    providers: [
      {
        provide: AUTHORIZATION_CODE_SERVICES,
        multi: true,
        useFactory: () =>
          Injector.create({
            name: `${libPrefix}-${AccessTokenFeatureKind.AuthorizationCodeFeature}-internal-injector`,
            parent: inject(Injector),
            providers: [
              {
                provide: AUTHORIZATION_CODE_CONFIG,
                useValue: config,
              },
              {
                provide: STORAGE_NAME,
                useFactory: () => inject(token).name,
              },
              {
                provide: AUTHORIZATION_CODE_STORAGE,
                useClass: StateIndexedDbStorage,
              },
              {
                provide: AccessTokenService,
                useFactory: () => inject(token),
              },
              AuthorizationCodeService,
            ],
          }).get(AuthorizationCodeService),
      },
    ],
  };
}
