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

  const selfProviders: AuthorizationCodeProviderFeature[] = [];

  features = features.filter(
    (
      feature,
    ): feature is Exclude<
      AuthorizationCodeFeatures,
      AuthorizationCodeProviderFeature
    > => {
      if (
        feature.kind ===
        AuthorizationCodeFeatureKind.AuthorizationCodeProviderFeature
      ) {
        selfProviders.push(feature);
        return false;
      }

      return true;
    },
  );

  if (selfProviders.length > 1) {
    throw new Error(
      'Only one accessTokenProvider feature allowed for AuthorizationCode!',
    );
  }

  const selfProvider: Provider[] =
    selfProviders.length === 0
      ? [
          {
            provide: AuthorizationCodeService,
            useFactory: () => {
              return new AuthorizationCodeService(
                fullConfig,
                inject(Oauth2Client),
              );
            },
          },
        ]
      : selfProviders[0].providers;

  return makeEnvironmentProviders([
    features.map((feature) => feature.providers),

    selfProvider,
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
