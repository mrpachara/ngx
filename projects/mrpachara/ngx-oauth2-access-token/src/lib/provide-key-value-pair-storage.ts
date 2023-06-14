import {
  EnvironmentProviders,
  InjectionToken,
  Provider,
  Type,
  ValueProvider,
  makeEnvironmentProviders,
} from '@angular/core';

import {
  FALLBACKABLE_KEY_VALUE_PAIR_STORAGE_FACTORY_TOKENS,
  KEY_VALUE_PAIR_STORAGE_FACTORY,
  STORAGE_INFO,
} from './tokens';
import { KeyValuePairStorageFactory } from './types';

export function provideKeyValuePairStorage(
  name: string,
  version: number,
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
      provide: STORAGE_INFO,
      useValue: { name, version },
    },
    features.map((feature) => feature.providers),
  ]);
}

export enum KeyValuepairStorageFeatureKind {
  KeyValuepairStorageFactoryProviderFeature,
  FallbackableKeyValuePairStorageFactoryTokensFeature,
}

export interface KeyValuepairStorageFeature<
  K extends KeyValuepairStorageFeatureKind,
> {
  readonly kind: K;
  readonly providers: Provider[];
}

export type KeyValuepairStorageFactoryProviderFeature =
  KeyValuepairStorageFeature<KeyValuepairStorageFeatureKind.KeyValuepairStorageFactoryProviderFeature>;

export function withKeyValuepairStorageFactoryProvider(
  factory: () => KeyValuePairStorageFactory,
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

export type FallbackableKeyValuePairStorageFactoryTokensFeature =
  KeyValuepairStorageFeature<KeyValuepairStorageFeatureKind.FallbackableKeyValuePairStorageFactoryTokensFeature>;

export function withFallbackableKeyValuePairStorageFactoryTokens(
  tokens: (
    | Type<KeyValuePairStorageFactory>
    | InjectionToken<KeyValuePairStorageFactory>
  )[],
): FallbackableKeyValuePairStorageFactoryTokensFeature {
  return {
    kind: KeyValuepairStorageFeatureKind.FallbackableKeyValuePairStorageFactoryTokensFeature,
    providers: [
      ...tokens.map(
        (token) =>
          ({
            provide: FALLBACKABLE_KEY_VALUE_PAIR_STORAGE_FACTORY_TOKENS,
            multi: true,
            useValue: token,
          } as ValueProvider),
      ),
    ],
  };
}

export type KeyValuePairStorageFeatures =
  | KeyValuepairStorageFactoryProviderFeature
  | FallbackableKeyValuePairStorageFactoryTokensFeature;
