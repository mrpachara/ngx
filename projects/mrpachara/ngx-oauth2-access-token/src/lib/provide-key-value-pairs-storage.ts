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

/**
 * Provide key-value paires storage factory and its features. You can provide
 * **only one** key-value paires storge factory but you can change the default
 * `FallbackableStorageFactory` by using
 * `withKeyValuePairsStorageFactoryProvider()` feature, e.g.:
 *
 * ```typescript
 * provideKeyValuePairsStorage(
 *   'my-app',
 *   1,
 *   withKeyValuePairsStorageFactoryProvider(
 *     () => inject(IndexedDbStorageFactory),
 *   ),
 * ),
 * ```
 *
 * @param name The application storage name
 * @param version The version of storage
 * @param features The provider features
 * @returns `EnvironmentProviders`
 */
export function provideKeyValuePairsStorage(
  name: string,
  version: number,
  ...features: KeyValuePairsStorageFeatures[]
): EnvironmentProviders {
  // ## FOR ##: normalizing featrues
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

  // ## FOR ##: making providers
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

/** Key-value paires storage factory provider feature */
export type KeyValuepairStorageFactoryProviderFeature =
  KeyValuepairStorageFeature<KeyValuepairStorageFeatureKind.KeyValuepairStorageFactoryProviderFeature>;

/**
 * Provide another instance of key-value paires storage factory than the default
 * one.
 *
 * @param factory The factory for creating instance
 * @returns `KeyValuepairStorageFactoryProviderFeature`
 */
export function withKeyValuePairsStorageFactoryProvider(
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

/** Fallbackable key-value pairs storage factory tokens feature */
export type FallbackableKeyValuePairsStorageFactoryTokensFeature =
  KeyValuepairStorageFeature<KeyValuepairStorageFeatureKind.FallbackableKeyValuePairsStorageFactoryTokensFeature>;

/**
 * Provide the fallbackable sequence of key-value pairs storage factory tokens
 * that can **only work** with `FallbackableStorageFactory`.
 *
 * @param tokens The injection tokens or classes
 * @returns `FallbackableKeyValuePairsStorageFactoryTokensFeature`
 */
export function withFallbackableKeyValuePairsStorageFactoryTokens(
  ...tokens: (
    | Type<KeyValuePairsStorageFactory>
    | InjectionToken<KeyValuePairsStorageFactory>
  )[]
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

/** All key-value pairs storage features */
export type KeyValuePairsStorageFeatures =
  | KeyValuepairStorageFactoryProviderFeature
  | FallbackableKeyValuePairsStorageFactoryTokensFeature;
