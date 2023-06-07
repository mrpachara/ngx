import {
  ENVIRONMENT_INITIALIZER,
  EnvironmentProviders,
  InjectionToken,
  Provider,
  Type,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';

import { JwkConfig, JwkFullConfig } from './types';
import { configJwk } from './functions';
import { JwkService } from './jwk.service';
import { JWK_SERVICES, JWT_INITIALIZED_STATE, JWT_VERIFIERS } from './tokens';

import { JwtEcdsaVerifier } from './jwt-verifiers/jwt-ecdsa.verifier';
import { JwtHmacVerifier } from './jwt-verifiers/jwt-hmac.verifier';
import { JwtRsassaVerifier } from './jwt-verifiers/jwt-rsassa.verifier';

export function provideJwk(
  config: JwkConfig,
  ...features: JwkFeatures[]
): EnvironmentProviders {
  const fullConfig = configJwk(config);

  const fullConfigToken = new InjectionToken<JwkFullConfig>(
    `jwk-full-config-${fullConfig.name}`,
  );

  const providerFeatures = features.filter(
    (feature): feature is JwkProviderFeature =>
      feature.kind === JwkFeatureKind.JwkProviderFeature,
  );

  if (providerFeatures.length > 1) {
    throw new Error('Only one jwkProvider feature is allowed for each Jwk!');
  }

  if (providerFeatures.length === 0) {
    features.push({
      kind: JwkFeatureKind.JwkProviderFeature,
      providers: [],
      injectionToken: JwkService,
      factory: (fullConfig) => new JwkService(fullConfig),
    });
  }

  features
    .filter(
      (feature): feature is JwkProviderFeature =>
        feature.kind === JwkFeatureKind.JwkProviderFeature,
    )
    .forEach((feature) =>
      feature.providers.push(
        {
          provide: feature.injectionToken,
          useFactory: () => feature.factory(inject(fullConfigToken)),
        },
        {
          provide: JWK_SERVICES,
          multi: true,
          useExisting: feature.injectionToken,
        },
      ),
    );

  return makeEnvironmentProviders([
    { provide: fullConfigToken, useValue: fullConfig },

    features.map((feature) => feature.providers),

    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => {
        const initializedState = inject(JWT_INITIALIZED_STATE);

        if (!initializedState.initialized) {
          initializedState.initialized = true;

          const verifiers = inject(JWT_VERIFIERS);

          verifiers.push(
            inject(JwtHmacVerifier),
            inject(JwtRsassaVerifier),
            inject(JwtEcdsaVerifier),
          );
        }
      },
    },
  ]);
}

export enum JwkFeatureKind {
  JwkProviderFeature,
}

export interface JwkFeature<K extends JwkFeatureKind> {
  readonly kind: K;
  readonly providers: Provider[];
}

export type JwkProviderFeature<T extends JwkService = JwkService> =
  JwkFeature<JwkFeatureKind.JwkProviderFeature> & {
    readonly injectionToken: Type<T> | InjectionToken<T>;
    readonly factory: (fullConfig: JwkFullConfig) => T;
  };

export function withJwkProvider<T extends JwkService>(
  injectionToken: Type<T> | InjectionToken<T>,
  factory: (fullConfig: JwkFullConfig) => T,
): JwkProviderFeature {
  return {
    kind: JwkFeatureKind.JwkProviderFeature,
    providers: [],
    injectionToken,
    factory,
  };
}

export type JwkFeatures = JwkProviderFeature;
