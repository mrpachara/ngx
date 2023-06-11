import {
  EnvironmentProviders,
  Provider,
  makeEnvironmentProviders,
} from '@angular/core';

import { KEY_VALUE_PAIR_STORAGE_FACTORY, STORAGE_VERSION } from './tokens';
import { KeyValuePairStorage } from './types';

export function provideKeyValuePairStorage(
  version: bigint,
  ...features: KeyValuePairStorageFeatures[]
): EnvironmentProviders {
  const factoryProviderFeatures = features.filter(
    (feature): feature is KeyValuepairStorageFactoryProviderFeature =>
      feature.kind ===
      KeyValuepairStorageFeatureKind.KeyValuepairStorageFactoryProviderFeature,
  );

  if (factoryProviderFeatures.length > 1) {
    throw new Error(
      'Only one keyValuePairFactoryProvider feature allowed for KeyValuePairStorage!',
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
  KeyValuepairStorageFactoryProviderFeature,
}

export interface KeyValuepairStorageFeature<
  K extends KeyValuepairStorageFeatureKind,
> {
  readonly kind: K;
  readonly providers: Provider[];
}

export type KeyValuepairStorageFactoryProviderFeature =
  KeyValuepairStorageFeature<KeyValuepairStorageFeatureKind.KeyValuepairStorageFactoryProviderFeature>;

export function withKeyValuepairStorageProvider(
  factory: () => KeyValuePairStorage,
): KeyValuepairStorageFactoryProviderFeature {
  return {
    kind: KeyValuepairStorageFeatureKind.KeyValuepairStorageFactoryProviderFeature,
    providers: [
      {
        provide: KEY_VALUE_PAIR_STORAGE_FACTORY,
        useFactory: factory,
      },
    ],
  };
}

export type KeyValuePairStorageFeatures =
  KeyValuepairStorageFactoryProviderFeature;
