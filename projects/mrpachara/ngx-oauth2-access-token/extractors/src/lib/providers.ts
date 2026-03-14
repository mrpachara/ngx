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
  libPrefix,
} from '@mrpachara/ngx-oauth2-access-token';
import { JwkDispatcher } from '@mrpachara/ngx-oauth2-access-token/jwk';
import {
  IdTokenInfo,
  JwtVerificationFailedError,
} from '@mrpachara/ngx-oauth2-access-token/standard';
import { IdTokenIndexedDbStorage } from '../internal/storage';
import { IdTokenExtractor } from './services';
import {
  ID_TOKEN_CLAIMS_TRANSFORMER,
  ID_TOKEN_STORAGE,
  ID_TOKEN_VERIFICATION,
} from './tokens';
import {
  IdTokenClaimsTransformer,
  IdTokenStorage,
  IdTokenVerification,
} from './types';

/**
 * Provide _id token_ extractor.
 *
 * @param features
 * @returns
 */
export function provideIdTokenExtractor(
  ...features: Feature[]
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
type Feature =
  | StorageFeature
  | VerificationFeature
  | ClaimsTransformationFeature;

// ------------- Enum -----------------
export enum FeatureKind {
  InternalFeature = 'INTERNAL_FEATURE',
}

// ------------- Type -----------------
interface FeatureType<K extends FeatureKind> {
  readonly kind: K;
  readonly providers: readonly Provider[];
}
// ------------- Features -----------------
type StorageFeature = FeatureType<FeatureKind.InternalFeature>;

type VerificationFeature = FeatureType<FeatureKind.InternalFeature>;

type ClaimsTransformationFeature = FeatureType<FeatureKind.InternalFeature>;

// ------------- Feature Functions -----------------
/**
 * Provide ID Token storage.
 *
 * @param factory
 * @returns
 */
export function withStorage(factory: () => IdTokenStorage): StorageFeature {
  return {
    kind: FeatureKind.InternalFeature,
    providers: [
      {
        provide: ID_TOKEN_STORAGE,
        useFactory: factory,
      },
    ],
  };
}

/**
 * Provide ID Token verification.
 *
 * @param factory
 * @returns
 */
export function withVerification(
  factory: () => IdTokenVerification,
): VerificationFeature {
  return {
    kind: FeatureKind.InternalFeature,
    providers: [
      {
        provide: ID_TOKEN_VERIFICATION,
        useFactory: factory,
      },
    ],
  };
}

/**
 * Provide ID Token `JwkDispatcher` verification.
 *
 * @param factory
 * @returns
 */
export function withJwkVerification(): VerificationFeature {
  return {
    kind: FeatureKind.InternalFeature,
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
 * Provide claims transformation.
 *
 * @param factory
 * @returns
 */
export function withClaimmsTransformation(
  factory: () => IdTokenClaimsTransformer,
): ClaimsTransformationFeature {
  return {
    kind: FeatureKind.InternalFeature,
    providers: [
      {
        provide: ID_TOKEN_CLAIMS_TRANSFORMER,
        useFactory: factory,
      },
    ],
  };
}
