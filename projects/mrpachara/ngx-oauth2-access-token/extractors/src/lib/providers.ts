import {
  EnvironmentProviders,
  inject,
  InjectionToken,
  Injector,
  makeEnvironmentProviders,
  Provider,
} from '@angular/core';
import {
  ACCESS_TOKEN_RESPONSE_EXTRACTORS,
  JwkDispatcher,
  libPrefix,
} from '@mrpachara/ngx-oauth2-access-token';
import {
  IdTokenInfo,
  JwtVerificationFailedError,
} from '@mrpachara/ngx-oauth2-access-token/standard';
import { IdTokenExtractor } from './services';
import { IdTokenIndexedDbStorage } from './storages';
import {
  ID_TOKEN_CLAIMS_TRANSFORMER,
  ID_TOKEN_STORAGE,
  ID_TOKEN_VERIFICATION,
} from './tokens';
import { IdTokenClaimsTransformer, IdTokenStorage } from './types';

export function provideIdTokenExtractor(
  ...features: IdTokenFeature[]
): EnvironmentProviders {
  const token = new InjectionToken<IdTokenExtractor>(
    `${libPrefix}-id-token-extractor:internal`,
  );

  return makeEnvironmentProviders([
    {
      provide: token,
      useFactory: () =>
        Injector.create({
          name: `${libPrefix}-id-token-extractor-injector:internal`,
          parent: inject(Injector),
          providers: [
            {
              provide: ID_TOKEN_STORAGE,
              useClass: IdTokenIndexedDbStorage,
            },
            features.map((feature) => feature.providers),
            IdTokenExtractor,
          ],
        }).get(IdTokenExtractor),
    },
    {
      provide: ACCESS_TOKEN_RESPONSE_EXTRACTORS,
      multi: true,
      useExisting: token,
    },
    {
      provide: IdTokenExtractor,
      useExisting: token,
    },
  ]);
}

// ------------- Avaliable Features -----------------
export type IdTokenFeature =
  | IdTokenStorageFeature
  | IdTokenVerificationFeature
  | IdTokenClaimsTransformerFeature;

// ------------- Enum -----------------
export enum IdTokenFeatureKind {
  IdTokenInternalFeature = 'ID_TOKEN:INTERNAL_FEATURE',
}

// ------------- Type -----------------
export interface IdTokenFeatureType<K extends IdTokenFeatureKind> {
  readonly kind: K;
  readonly providers: readonly Provider[];
}
// ------------- Features -----------------
export type IdTokenStorageFeature =
  IdTokenFeatureType<IdTokenFeatureKind.IdTokenInternalFeature>;

export type IdTokenVerificationFeature =
  IdTokenFeatureType<IdTokenFeatureKind.IdTokenInternalFeature>;

export type IdTokenClaimsTransformerFeature =
  IdTokenFeatureType<IdTokenFeatureKind.IdTokenInternalFeature>;

// ------------- Feature Functions -----------------
/**
 * Provide ID Token storage.
 *
 * @param factory
 * @returns
 */
export function withIdTokenStorage(
  factory: () => IdTokenStorage,
): IdTokenStorageFeature {
  return {
    kind: IdTokenFeatureKind.IdTokenInternalFeature,
    providers: [
      {
        provide: ID_TOKEN_STORAGE,
        useFactory: factory,
      },
    ],
  };
}

// TODO: separate to 2 feature, from JwkDispatcher and manual factory
/**
 * Provide ID Token verification.
 *
 * @param factory
 * @returns
 */
export function withIdTokenVerification(): IdTokenVerificationFeature {
  return {
    kind: IdTokenFeatureKind.IdTokenInternalFeature,
    providers: [
      {
        provide: ID_TOKEN_VERIFICATION,
        useFactory: () => {
          const jwkDispatcher = inject(JwkDispatcher);

          return async (idTokenInfo: IdTokenInfo) => {
            const verified = await jwkDispatcher.verify(idTokenInfo);

            if (!verified) {
              throw new JwtVerificationFailedError(idTokenInfo);
            }
          };
        },
      },
    ],
  };
}

/**
 * Provide claims transformer.
 *
 * @param factory
 * @returns
 */
export function withClaimmsTransformer(
  factory: () => IdTokenClaimsTransformer,
): IdTokenClaimsTransformerFeature {
  return {
    kind: IdTokenFeatureKind.IdTokenInternalFeature,
    providers: [
      {
        provide: ID_TOKEN_CLAIMS_TRANSFORMER,
        useFactory: factory,
      },
    ],
  };
}
