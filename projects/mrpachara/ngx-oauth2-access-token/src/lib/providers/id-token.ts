import { inject, InjectionToken, Injector, Provider } from '@angular/core';
import { AccessTokenService } from '../services';
import { IdTokenExtractor } from '../services/id-token.extractor';
import { IdTokenIndexedDbStorage } from '../storages';
import { STORAGE_NAME } from '../tokens';
import {
  ID_TOKEN_EXTRACTOR_TOKENS,
  ID_TOKEN_EXTRACTORE_HIERARCHIZED_TOKENS,
  ID_TOKEN_STORAGE,
} from '../tokens/id-token';
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
                  provide: AccessTokenService,
                  useExisting: accessTokenServiceToken,
                },
                {
                  provide: STORAGE_NAME,
                  useFactory: () => inject(AccessTokenService).name,
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
          provide: IdTokenExtractor,
          useExisting: token,
        },
      ];
    },
  };
}

// ------------- Avaliable Features -----------------
export type IdTokenFeature = IdTokenStorageFeature;

// ------------- Enum -----------------
export enum IdTokenFeatureKind {
  IdTokenStorageFeature = 'ID_TOKEN:ID_TOKEN_STORAGE_FEATURE',
}

// ------------- Type -----------------
export interface IdTokenFeatureType<K extends IdTokenFeatureKind> {
  readonly kind: K;
  readonly providers: readonly Provider[];
}
// ------------- Features -----------------
export type IdTokenStorageFeature =
  IdTokenFeatureType<IdTokenFeatureKind.IdTokenStorageFeature>;

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
