import {
  EnvironmentProviders,
  InjectionToken,
  Provider,
  Type,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';

import { configOauth2Client } from './functions';
import { Oauth2ClientConfig, Oauth2ClientErrorTransformer } from './types';
import { OAUTH2_CLIENT_ERROR_TRANSFORMER } from './tokens';

import { Oauth2Client } from './oauth2.client';

export function provideOauth2Client(
  config: Oauth2ClientConfig,
  ...features: Oauth2ClientFeatures[]
): EnvironmentProviders {
  const fullConfig = configOauth2Client(config);

  const selfProviders = features.filter(
    (feature): feature is Oauth2ClientProviderFeature =>
      feature.kind === Oauth2ClientFeatureKind.Oauth2ClientProviderFeature,
  );

  if (selfProviders.length > 1) {
    throw new Error(
      'Only one accessTokenProvider feature allowed for Oauth2Client!',
    );
  }

  if (selfProviders.length === 0) {
    features.push({
      kind: Oauth2ClientFeatureKind.Oauth2ClientProviderFeature,
      providers: [
        {
          provide: Oauth2Client,
          useFactory: () => {
            return new Oauth2Client(
              fullConfig,
              inject(OAUTH2_CLIENT_ERROR_TRANSFORMER),
            );
          },
        },
      ],
    });
  }

  return makeEnvironmentProviders([
    features.map((feature) => feature.providers),
  ]);
}

export enum Oauth2ClientFeatureKind {
  Oauth2ClientProviderFeature,
  ErrorTransformerFeature,
}

export interface Oauth2ClientFeature<K extends Oauth2ClientFeatureKind> {
  readonly kind: K;
  readonly providers: Provider[];
}

export type Oauth2ClientProviderFeature =
  Oauth2ClientFeature<Oauth2ClientFeatureKind.Oauth2ClientProviderFeature>;

export function withOauth2ClientProvider<T extends Oauth2Client>(
  injectionToken: Type<T> | InjectionToken<T>,
  factory: () => T,
): Oauth2ClientProviderFeature {
  return {
    kind: Oauth2ClientFeatureKind.Oauth2ClientProviderFeature,
    providers: [{ provide: injectionToken, useFactory: factory }],
  };
}

export type ErrorTransformerFeature =
  Oauth2ClientFeature<Oauth2ClientFeatureKind.ErrorTransformerFeature>;

export function withErrorTransformer(
  transformerFactory: () => Oauth2ClientErrorTransformer,
): ErrorTransformerFeature {
  return {
    kind: Oauth2ClientFeatureKind.ErrorTransformerFeature,
    providers: [
      {
        provide: OAUTH2_CLIENT_ERROR_TRANSFORMER,
        useFactory: transformerFactory,
      },
    ],
  };
}

export type Oauth2ClientFeatures =
  | Oauth2ClientProviderFeature
  | ErrorTransformerFeature;
