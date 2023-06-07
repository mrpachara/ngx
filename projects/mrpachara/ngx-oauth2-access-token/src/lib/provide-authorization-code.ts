import {
  EnvironmentProviders,
  InjectionToken,
  Provider,
  Type,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';

import { configAuthorizationCode } from './functions';
import { AuthorizationCodeService, Oauth2Client } from './services';
import { AUTHORIZATION_CODE_SERVICES } from './tokens';
import { AuthorizationCodeConfig, AuthorizationCodeFullConfig } from './types';

export function provideAuthorizationCode(
  config: AuthorizationCodeConfig,
  ...features: AuthorizationCodeFeatures[]
): EnvironmentProviders {
  const fullConfig = configAuthorizationCode(config);

  const fullConfigToken = new InjectionToken<AuthorizationCodeFullConfig>(
    `authorization-code-full-config-${fullConfig.name}`,
  );

  const prodiverFeatures = features.filter(
    (feature): feature is AuthorizationCodeProviderFeature =>
      feature.kind ===
      AuthorizationCodeFeatureKind.AuthorizationCodeProviderFeature,
  );

  if (prodiverFeatures.length > 1) {
    throw new Error(
      'Only one accessTokenProvider feature is allowed for each AuthorizationCode!',
    );
  }

  if (prodiverFeatures.length === 0) {
    features.push({
      kind: AuthorizationCodeFeatureKind.AuthorizationCodeProviderFeature,
      providers: [],
      injectionToken: AuthorizationCodeService,
      factory: (fullConfig) =>
        new AuthorizationCodeService(fullConfig, inject(Oauth2Client)),
    });
  }

  features
    .filter(
      (feature): feature is AuthorizationCodeProviderFeature =>
        feature.kind ===
        AuthorizationCodeFeatureKind.AuthorizationCodeProviderFeature,
    )
    .forEach((feature) =>
      feature.providers.push(
        {
          provide: feature.injectionToken,
          useFactory: () => feature.factory(inject(fullConfigToken)),
        },
        {
          provide: AUTHORIZATION_CODE_SERVICES,
          useExisting: feature.injectionToken,
        },
      ),
    );

  return makeEnvironmentProviders([
    { provide: fullConfigToken, useValue: fullConfig },

    features.map((feature) => feature.providers),
  ]);
}

export enum AuthorizationCodeFeatureKind {
  AuthorizationCodeProviderFeature,
}

export interface AuthorizationCodeFeature<
  K extends AuthorizationCodeFeatureKind,
> {
  readonly kind: K;
  readonly providers: Provider[];
}

export type AuthorizationCodeProviderFeature<
  T extends AuthorizationCodeService = AuthorizationCodeService,
> =
  AuthorizationCodeFeature<AuthorizationCodeFeatureKind.AuthorizationCodeProviderFeature> & {
    injectionToken: Type<T> | InjectionToken<T>;
    factory: (fullConfig: AuthorizationCodeFullConfig) => T;
  };

export function withAuthorizationCodeProvider<
  T extends AuthorizationCodeService,
>(
  injectionToken: Type<T> | InjectionToken<T>,
  factory: (fullConfig: AuthorizationCodeFullConfig) => T,
): AuthorizationCodeProviderFeature {
  return {
    kind: AuthorizationCodeFeatureKind.AuthorizationCodeProviderFeature,
    providers: [],
    injectionToken,
    factory,
  };
}

export type AuthorizationCodeFeatures = AuthorizationCodeProviderFeature;
