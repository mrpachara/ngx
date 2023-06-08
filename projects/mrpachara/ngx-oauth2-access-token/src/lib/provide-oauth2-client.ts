import {
  EnvironmentProviders,
  InjectionToken,
  Provider,
  Type,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';

import { configOauth2Client } from './functions';
import { Oauth2Client } from './services';
import { OATUTH2_CLIENTS, OAUTH2_CLIENT_ERROR_TRANSFORMER } from './tokens';
import {
  Oauth2ClientConfig,
  Oauth2ClientErrorTransformer,
  Oauth2ClientFullConfig,
} from './types';

export function provideOauth2Client(
  config: Oauth2ClientConfig,
  ...features: Oauth2ClientFeatures[]
): EnvironmentProviders {
  const fullConfig = configOauth2Client(config);

  const fullConfigToken = new InjectionToken<Oauth2ClientFullConfig>(
    `oauth2-client-full-config-${fullConfig.name}`,
    {
      providedIn: 'root',
      factory: () => fullConfig,
    },
  );

  const selfProviders = features.filter(
    (feature): feature is Oauth2ClientProviderFeature =>
      feature.kind === Oauth2ClientFeatureKind.Oauth2ClientProviderFeature,
  );

  if (selfProviders.length > 1) {
    throw new Error(
      'Only one accessTokenProvider feature is allowed for each Oauth2Client!',
    );
  }

  if (selfProviders.length === 0) {
    features.push({
      kind: Oauth2ClientFeatureKind.Oauth2ClientProviderFeature,
      providers: [],
      injectionToken: Oauth2Client,
      factory: (fullConfig) =>
        new Oauth2Client(fullConfig, inject(OAUTH2_CLIENT_ERROR_TRANSFORMER)),
    });
  }

  features
    .filter(
      (feature): feature is Oauth2ClientProviderFeature =>
        feature.kind === Oauth2ClientFeatureKind.Oauth2ClientProviderFeature,
    )
    .forEach((feature) =>
      feature.providers.push(
        {
          provide: feature.injectionToken,
          useFactory: () => feature.factory(inject(fullConfigToken)),
        },
        {
          provide: OATUTH2_CLIENTS,
          multi: true,
          useExisting: feature.injectionToken,
        },
      ),
    );

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

export type Oauth2ClientProviderFeature<T extends Oauth2Client = Oauth2Client> =
  Oauth2ClientFeature<Oauth2ClientFeatureKind.Oauth2ClientProviderFeature> & {
    injectionToken: Type<T> | InjectionToken<T>;
    factory: (fullConfig: Oauth2ClientFullConfig) => T;
  };

export function withOauth2ClientProvider<T extends Oauth2Client>(
  injectionToken: Type<T> | InjectionToken<T>,
  factory: (fullConfig: Oauth2ClientFullConfig) => T,
): Oauth2ClientProviderFeature {
  return {
    kind: Oauth2ClientFeatureKind.Oauth2ClientProviderFeature,
    providers: [],
    injectionToken,
    factory,
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
