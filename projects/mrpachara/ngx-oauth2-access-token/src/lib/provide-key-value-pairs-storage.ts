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
import { KeyValuePairsStorageFactory } from './types';

export function provideKeyValuePairsStorage(
  name: string,
  version: number,
  ...features: KeyValuePairsStorageFeatures[]
): EnvironmentProviders {
  const factoryProviderFeatures = features.filter(
    (feature): feature is KeyValuepairStorageFactoryProviderFeature =>
      feature.kind ===
      KeyValuepairStorageFeatureKind.KeyValuepairStorageFactoryProviderFeature,
  );

  if (factoryProviderFeatures.length > 1) {
    throw new Error(
      'Only one keyValuePairsFactoryProvider feature allowed for KeyValuePairsStorage!',
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
  FallbackableKeyValuePairsStorageFactoryTokensFeature,
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
  factory: () => KeyValuePairsStorageFactory,
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

export type FallbackableKeyValuePairsStorageFactoryTokensFeature =
  KeyValuepairStorageFeature<KeyValuepairStorageFeatureKind.FallbackableKeyValuePairsStorageFactoryTokensFeature>;

export function withFallbackableKeyValuePairsStorageFactoryTokens(
  tokens: (
    | Type<KeyValuePairsStorageFactory>
    | InjectionToken<KeyValuePairsStorageFactory>
  )[],
): FallbackableKeyValuePairsStorageFactoryTokensFeature {
  return {
    kind: KeyValuepairStorageFeatureKind.FallbackableKeyValuePairsStorageFactoryTokensFeature,
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

export type KeyValuePairsStorageFeatures =
  | KeyValuepairStorageFactoryProviderFeature
  | FallbackableKeyValuePairsStorageFactoryTokensFeature;
