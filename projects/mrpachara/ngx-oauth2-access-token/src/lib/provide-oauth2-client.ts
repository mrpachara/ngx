import {
  EnvironmentProviders,
  Provider,
  makeEnvironmentProviders,
} from '@angular/core';
import {
  Oauth2ClientConfig,
  Oauth2ClientErrorTransformer,
  Oauth2ClientFullConfig,
  PickOptional,
} from './types';
import {
  OAUTH2_CLIENT_ERROR_TRANSFORMER,
  OAUTH2_CLIENT_FULL_CONFIG,
} from './tokens';

const defaultConfig: PickOptional<Omit<Oauth2ClientConfig, 'clientSecret'>> = {
  debug: false,
  clientCredentialsInParams: false,
};

export function provideOauth2Client(
  config: Oauth2ClientConfig,
  ...features: Oauth2ClientFeatures[]
): EnvironmentProviders {
  const fullConfig: Oauth2ClientFullConfig = {
    ...defaultConfig,
    ...config,
  };

  return makeEnvironmentProviders([
    {
      provide: OAUTH2_CLIENT_FULL_CONFIG,
      useValue: fullConfig,
    },
    features.map((feature) => feature.providers),
  ]);
}

export enum Oauth2ClientFeatureKind {
  ErrorTransformerFeature,
}

export interface Oauth2ClientFeature<K extends Oauth2ClientFeatureKind> {
  readonly kind: K;
  readonly providers: Provider[];
}

export type ErrorTransformerFeature =
  Oauth2ClientFeature<Oauth2ClientFeatureKind.ErrorTransformerFeature>;

export type Oauth2ClientFeatures = ErrorTransformerFeature;

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
