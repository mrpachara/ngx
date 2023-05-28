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
  return makeEnvironmentProviders([
    {
      provide: STORAGE_VERSION,
      useValue: version,
    },
    features.map((feature) => feature.providers),
  ]);
}

export enum KeyValuepairStorageFeatureKind {
  CustomStorageFeature,
}

export interface KeyValuepairStorageFeature<
  K extends KeyValuepairStorageFeatureKind,
> {
  readonly kind: K;
  readonly providers: Provider[];
}

export type CustomStorageFeature =
  KeyValuepairStorageFeature<KeyValuepairStorageFeatureKind.CustomStorageFeature>;

export type KeyValuepairStorageFeatures = CustomStorageFeature;

export function withCustomStorage(
  storageFactory: () => KeyValuePairStorage,
): CustomStorageFeature {
  return {
    kind: KeyValuepairStorageFeatureKind.CustomStorageFeature,
    providers: [
      {
        provide: KEY_VALUE_PAIR_STORAGE,
        useFactory: storageFactory,
      },
    ],
  };
}
