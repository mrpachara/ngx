import {
  EnvironmentProviders,
  ExistingProvider,
  FactoryProvider,
  InjectionToken,
  Provider,
  Type,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';

import { configJwk } from './functions';
import { JwkService } from './services';
import { JWK_SERVICES } from './tokens';
import { JwkConfig, JwkFullConfig } from './types';

/**
 * Provide JWK service and its features. For creating multiple JWK services, use
 * `provideJwk()` multiple times with `withJwkProvider()` feature, e.g.:
 *
 * ```typescript
 * provideJwk(configA),
 * provideJwk(
 *   configB,
 *   withJwkProvider(
 *     JWK_SERVICE_B,
 *     (fullConfigB) => new JwkService(fullConfigB),
 *   ),
 * ),
 * ```
 *
 * @param config The configuration of service
 * @param features The provider features
 * @returns `EnvironmentProviders`
 */
export function provideJwk(
  config: JwkConfig,
  ...features: JwkFeatures[]
): EnvironmentProviders {
  const fullConfig = configJwk(config);

  const fullConfigToken = new InjectionToken<JwkFullConfig>(
    `jwk-full-config-${fullConfig.name}`,
    {
      providedIn: 'root',
      factory: () => fullConfig,
    },
  );

  // ## FOR ##: normalizing featrues
  const providerFeatures = features.filter(
    (feature): feature is JwkProviderFeature =>
      feature.kind === JwkFeatureKind.JwkProviderFeature,
  );

  if (providerFeatures.length > 1) {
    throw new Error('Only one jwkProvider feature is allowed for each Jwk!');
  }

  if (providerFeatures.length === 0) {
    features.push(
      withJwkProvider(JwkService, (fullConfig) => new JwkService(fullConfig)),
    );
  }

  // ## FOR ##: JwkProviderFeature
  features
    .filter(
      (feature): feature is JwkProviderFeature =>
        feature.kind === JwkFeatureKind.JwkProviderFeature,
    )
    .forEach((feature) => feature.assign(fullConfigToken));

  // ## FOR ##: making providers
  return makeEnvironmentProviders([
    { provide: fullConfigToken, useValue: fullConfig },

    features.map((feature) => feature.providers),
  ]);
}

export enum JwkFeatureKind {
  JwkProviderFeature,
}

export interface JwkFeature<K extends JwkFeatureKind> {
  readonly kind: K;
  readonly providers: Provider[];
}

/** JWK service provider feature */
export type JwkProviderFeature<T extends JwkService = JwkService> =
  JwkFeature<JwkFeatureKind.JwkProviderFeature> & {
    readonly token: Type<T> | InjectionToken<T>;
    readonly factory: (fullConfig: JwkFullConfig) => T;
    assign(fullConfigToken: InjectionToken<JwkFullConfig>): void;
  };

/**
 * Provide another `JwkService` than the default one.
 *
 * @param token The injection token or class to be used
 * @param factory The factory for creating instance
 * @returns `JwkProviderFeature`
 */
export function withJwkProvider<T extends JwkService>(
  token: Type<T> | InjectionToken<T>,
  factory: (fullConfig: JwkFullConfig) => T,
): JwkProviderFeature {
  return {
    kind: JwkFeatureKind.JwkProviderFeature,
    providers: [],
    token,
    factory,
    assign(fullConfigToken) {
      this.providers.splice(0);
      this.providers.push(
        {
          provide: this.token,
          useFactory: () => this.factory(inject(fullConfigToken)),
        } as FactoryProvider,
        {
          provide: JWK_SERVICES,
          multi: true,
          useExisting: this.token,
        } as ExistingProvider,
      );
    },
  };
}

/** All JWK features */
export type JwkFeatures = JwkProviderFeature;
