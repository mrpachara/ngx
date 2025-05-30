import { inject, Injector, Provider } from '@angular/core';
import { libPrefix } from '../predefined';
import { AccessTokenService } from '../services';
import { IdTokenExtractor } from '../services/id-token.extractor';
import { IdTokenIndexedDbStorage } from '../storages';
import { STORAGE_NAME } from '../tokens';
import { ID_TOKEN_EXTRACTORS, ID_TOKEN_STORAGE } from '../tokens/id-token';
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
    providers: (token) => [
      {
        provide: ID_TOKEN_EXTRACTORS,
        multi: true,
        useFactory: () =>
          Injector.create({
            name: `${libPrefix}-id-token-internal-injector`,
            parent: inject(Injector),
            providers: [
              {
                provide: STORAGE_NAME,
                useFactory: () => inject(token).name,
              },
              {
                provide: ID_TOKEN_STORAGE,
                useClass: IdTokenIndexedDbStorage,
              },
              {
                provide: AccessTokenService,
                useExisting: token,
              },
              features.map((feature) => feature.providers),
              IdTokenExtractor,
            ],
          }).get(IdTokenExtractor),
      },
    ],
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
