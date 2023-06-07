import {
  EnvironmentProviders,
  InjectionToken,
  Provider,
  Type,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import { AuthorizationCodeConfig } from './types';
import { configAuthorizationCode } from './functions';

import { AuthorizationCodeService } from './authorization-code.service';
import { Oauth2Client } from './oauth2.client';

export function provideAuthorizationCode(
  config: AuthorizationCodeConfig,
  ...features: AuthorizationCodeFeatures[]
): EnvironmentProviders {
  const fullConfig = configAuthorizationCode(config);

  const selfProviders = features.filter(
    (feature): feature is AuthorizationCodeProviderFeature =>
      feature.kind ===
      AuthorizationCodeFeatureKind.AuthorizationCodeProviderFeature,
  );

  if (selfProviders.length > 1) {
    throw new Error(
      'Only one accessTokenProvider feature allowed for AuthorizationCode!',
    );
  }

  if (selfProviders.length === 0) {
    features.push({
      kind: AuthorizationCodeFeatureKind.AuthorizationCodeProviderFeature,
      providers: [
        {
          provide: AuthorizationCodeService,
          useFactory: () => {
            return new AuthorizationCodeService(
              fullConfig,
              inject(Oauth2Client),
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

export enum AuthorizationCodeFeatureKind {
  AuthorizationCodeProviderFeature,
}

export interface AuthorizationCodeFeature<
  K extends AuthorizationCodeFeatureKind,
> {
  readonly kind: K;
  readonly providers: Provider[];
}

export type AuthorizationCodeProviderFeature =
  AuthorizationCodeFeature<AuthorizationCodeFeatureKind.AuthorizationCodeProviderFeature>;

export function withAuthorizationCodeProvider<
  T extends AuthorizationCodeService,
>(
  injectionToken: Type<T> | InjectionToken<T>,
  factory: () => T,
): AuthorizationCodeProviderFeature {
  return {
    kind: AuthorizationCodeFeatureKind.AuthorizationCodeProviderFeature,
    providers: [{ provide: injectionToken, useFactory: factory }],
  };
}

export type AuthorizationCodeFeatures = AuthorizationCodeProviderFeature;
