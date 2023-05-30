import {
  EnvironmentProviders,
  InjectionToken,
  Provider,
  Type,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import { Observable } from 'rxjs';

import { RENEW_ACCESS_TOKEN_SOURCE } from './tokens';
import {
  AccessTokenConfig,
  AccessTokenResponse,
  AccessTokenResponseListener,
} from './types';
import { RefreshTokenService } from './refresh-token.service';
import { configAccessToken, configRefreshToken } from './functions';
import { AccessTokenService } from './access-token.service';
import { Oauth2Client } from './oauth2.client';

export function provideAccessToken(
  config: AccessTokenConfig,
  ...features: AccessTokenFeatures[]
): EnvironmentProviders {
  const fullConfig = configAccessToken(config, [
    [RefreshTokenService, configRefreshToken({})],
  ]);

  const selfProviders: AccessTokenProviderFeature[] = [];

  features = features.filter(
    (
      feature,
    ): feature is Exclude<AccessTokenFeatures, AccessTokenProviderFeature> => {
      if (feature.kind === AccessTokenFeatureKind.AccessTokenProviderFeature) {
        selfProviders.push(feature);
        return false;
      }

      return true;
    },
  );

  if (selfProviders.length > 1) {
    throw new Error(
      'Only one accessTokenProvider feature allowed for AccessToken!',
    );
  }

  const selfProvider: Provider[] =
    selfProviders.length === 0
      ? [
          {
            provide: AccessTokenService,
            useFactory: () => {
              return new AccessTokenService(
                fullConfig,
                inject(Oauth2Client),
                inject(RENEW_ACCESS_TOKEN_SOURCE, { optional: true }),
              );
            },
          },
        ]
      : selfProviders[0].providers;

  return makeEnvironmentProviders([
    features.map((feature) => {
      if (
        feature.kind ===
        AccessTokenFeatureKind.AccessListenerResponseListenerFeature
      ) {
        fullConfig.listeners.push([feature.type, feature.config]);
      }

      return feature.providers;
    }),

    selfProvider,
  ]);
}

export enum AccessTokenFeatureKind {
  AccessTokenProviderFeature,
  RenewAccessTokenSourceFeature,
  AccessListenerResponseListenerFeature,
}

export interface AccessTokenFeature<K extends AccessTokenFeatureKind> {
  readonly kind: K;
  readonly providers: Provider[];
}

export type AccessTokenProviderFeature =
  AccessTokenFeature<AccessTokenFeatureKind.AccessTokenProviderFeature>;

export function withAccessTokenProvider<T extends AccessTokenService>(
  injectionToken: Type<T> | InjectionToken<T>,
  factory: () => T,
): AccessTokenProviderFeature {
  return {
    kind: AccessTokenFeatureKind.AccessTokenProviderFeature,
    providers: [{ provide: injectionToken, useFactory: factory }],
  };
}

export type RenewAccessTokenSourceFeature =
  AccessTokenFeature<AccessTokenFeatureKind.RenewAccessTokenSourceFeature>;

export function withRenewAccessTokenSource(
  sourceFactory: () => Observable<AccessTokenResponse>,
): RenewAccessTokenSourceFeature {
  return {
    kind: AccessTokenFeatureKind.RenewAccessTokenSourceFeature,
    providers: [
      {
        provide: RENEW_ACCESS_TOKEN_SOURCE,
        useFactory: sourceFactory,
      },
    ],
  };
}

export type AccessListenerResponseListenerFeature<
  T extends AccessTokenResponse = AccessTokenResponse,
  C = unknown,
> = AccessTokenFeature<AccessTokenFeatureKind.AccessListenerResponseListenerFeature> & {
  type: Type<AccessTokenResponseListener<T, C>>;
  config: C;
};

export function withAccessTokenResponseListener<
  T extends AccessTokenResponse,
  C,
>(
  type: Type<AccessTokenResponseListener<T, C>>,
  config: C,
): AccessListenerResponseListenerFeature<T, C> {
  return {
    kind: AccessTokenFeatureKind.AccessListenerResponseListenerFeature,
    type: type,
    config: config,
    providers: [],
  };
}

export type AccessTokenFeatures =
  | AccessTokenProviderFeature
  | RenewAccessTokenSourceFeature
  | AccessListenerResponseListenerFeature;
