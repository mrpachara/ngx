import { inject, InjectionToken, Injector, Provider } from '@angular/core';
import { JwtVerificationFailedError } from '../errors';
import { JwkDispatcher } from '../services';
import { IdTokenExtractor } from '../services/id-token.extractor';
import { IdTokenIndexedDbStorage } from '../storages';
import {
  ACCESS_TOKEN_RESPONSE_EXTRACTORS,
  EXTRACTOR_ID,
  STORAGE_NAME,
} from '../tokens';
import {
  ID_TOKEN_CLAIMS_TRANSFORMER,
  ID_TOKEN_EXTRACTOR_TOKENS,
  ID_TOKEN_EXTRACTORE_HIERARCHIZED_TOKENS,
  ID_TOKEN_STORAGE,
  ID_TOKEN_VERIFICATION,
} from '../tokens/id-token';
import { IdTokenClaimsTransformer, IdTokenInfo } from '../types';
import { IdTokenStorage } from '../types/storages/id-token';
import {
  AccessTokenExtensionFeature,
  AccessTokenFeatureKind,
} from './access-token';

/**
 * Provide ID Token extractor.
 *
 * @param factory
 * @returns
 */
export function withIdTokenExtractor(
  ...features: IdTokenFeature[]
): AccessTokenExtensionFeature {
  return {
    kind: AccessTokenFeatureKind.AccessTokenExtensionFeature,
    internal: false,
    providers: (id, accessTokenServiceToken) => {
      const token = new InjectionToken<IdTokenExtractor>(
        `${accessTokenServiceToken}:id-token-extractor`,
      );

      return [
        {
          provide: token,
          useFactory: () =>
            Injector.create({
              name: `${token}-internal`,
              parent: inject(Injector),
              providers: [
                {
                  provide: EXTRACTOR_ID,
                  useValue: id,
                },
                {
                  provide: STORAGE_NAME,
                  useFactory: () =>
                    inject(EXTRACTOR_ID).description ?? 'unknown',
                },
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
          provide: ID_TOKEN_EXTRACTOR_TOKENS,
          multi: true,
          useValue: { id, token } as const,
        },
        {
          provide: ID_TOKEN_EXTRACTORE_HIERARCHIZED_TOKENS,
          useFactory: () => [
            ...(inject(ID_TOKEN_EXTRACTORE_HIERARCHIZED_TOKENS, {
              skipSelf: true,
              optional: true,
            }) ?? []),
            ...inject(ID_TOKEN_EXTRACTOR_TOKENS),
          ],
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
      ];
    },
  };
}

// ------------- Avaliable Features -----------------
export type IdTokenFeature =
  | IdTokenStorageFeature
  | IdTokenVerificationFeature
  | IdTokenClaimsTransformerFeature;

// ------------- Enum -----------------
export enum IdTokenFeatureKind {
  IdTokenStorageFeature = 'ID_TOKEN:ID_TOKEN_STORAGE_FEATURE',
  IdTokenVerificationFeature = 'ID_TOKEN:ID_TOKEN_VERIFICATION',
  IdTokenClaimsTransformerFeature = 'ID_TOKEN:ID_TOKEN_CLAIMS_TRANSFORMER_FEATURE',
}

// ------------- Type -----------------
export interface IdTokenFeatureType<K extends IdTokenFeatureKind> {
  readonly kind: K;
  readonly providers: readonly Provider[];
}
// ------------- Features -----------------
export type IdTokenStorageFeature =
  IdTokenFeatureType<IdTokenFeatureKind.IdTokenStorageFeature>;

export type IdTokenVerificationFeature =
  IdTokenFeatureType<IdTokenFeatureKind.IdTokenVerificationFeature>;

export type IdTokenClaimsTransformerFeature =
  IdTokenFeatureType<IdTokenFeatureKind.IdTokenClaimsTransformerFeature>;

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
    kind: IdTokenFeatureKind.IdTokenStorageFeature,
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
export function withIdTokenVerification(): IdTokenVerificationFeature {
  return {
    kind: IdTokenFeatureKind.IdTokenVerificationFeature,
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
    kind: IdTokenFeatureKind.IdTokenClaimsTransformerFeature,
    providers: [
      {
        provide: ID_TOKEN_CLAIMS_TRANSFORMER,
        useFactory: factory,
      },
    ],
  };
}
