import {
  EnvironmentProviders,
  Provider,
  makeEnvironmentProviders,
} from '@angular/core';

import { KEY_VALUE_PAIR_STORAGE, STORAGE_VERSION } from './tokens';
import { KeyValuePairStorage } from './types';

export function provideKeyValuePairStorage(
  version: bigint,
  ...features: KeyValuepairStorageFeatures[]
): EnvironmentProviders {
  const providerFeatures = features.filter(
    (feature): feature is KeyValuepairStorageProviderFeature =>
      feature.kind ===
      KeyValuepairStorageFeatureKind.KeyValuepairStorageProviderFeature,
  );

  if (providerFeatures.length > 1) {
    throw new Error(
      'Only one accessTokenProvider feature allowed for AuthorizationCode!',
    );
  }

  return makeEnvironmentProviders([
    {
      provide: STORAGE_VERSION,
      useValue: version,
    },
    features.map((feature) => feature.providers),
  ]);
}

export enum KeyValuepairStorageFeatureKind {
  KeyValuepairStorageProviderFeature,
}

export interface KeyValuepairStorageFeature<
  K extends KeyValuepairStorageFeatureKind,
> {
  readonly kind: K;
  readonly providers: Provider[];
}

export type KeyValuepairStorageProviderFeature =
  KeyValuepairStorageFeature<KeyValuepairStorageFeatureKind.KeyValuepairStorageProviderFeature>;

export function withKeyValuepairStorageProvider(
  factory: () => KeyValuePairStorage,
): KeyValuepairStorageProviderFeature {
  return {
    kind: KeyValuepairStorageFeatureKind.KeyValuepairStorageProviderFeature,
    providers: [
      {
        provide: KEY_VALUE_PAIR_STORAGE,
        useFactory: factory,
      },
    ],
  };
}

export type KeyValuepairStorageFeatures = KeyValuepairStorageProviderFeature;
