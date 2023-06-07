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
  AccessTokenResponseExtractor,
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

  const selfProviders = features.filter(
    (feature): feature is AccessTokenProviderFeature =>
      feature.kind === AccessTokenFeatureKind.AccessTokenProviderFeature,
  );

  if (selfProviders.length > 1) {
    throw new Error(
      'Only one accessTokenProvider feature allowed for AccessToken!',
    );
  }

  if (selfProviders.length === 0) {
    features.push({
      kind: AccessTokenFeatureKind.AccessTokenProviderFeature,
      providers: [
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
      ],
    });
  }

  return makeEnvironmentProviders([
    features.map((feature) => {
      if (
        feature.kind ===
        AccessTokenFeatureKind.AccessTokenResponseExtractorFeature
      ) {
        fullConfig.extractors.push([feature.type, feature.config]);
      }

      return feature.providers;
    }),
  ]);
}

export enum AccessTokenFeatureKind {
  AccessTokenProviderFeature,
  RenewAccessTokenSourceFeature,
  AccessTokenResponseExtractorFeature,
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

export type AccessTokenResponseExtractorFeature<
  T extends AccessTokenResponse = AccessTokenResponse,
  C = unknown,
> = AccessTokenFeature<AccessTokenFeatureKind.AccessTokenResponseExtractorFeature> & {
  type: Type<AccessTokenResponseExtractor<T, C>>;
  config: C;
};

export function withAccessTokenResponseExtractor<
  T extends AccessTokenResponse,
  C,
>(
  type: Type<AccessTokenResponseExtractor<T, C>>,
  config: C,
): AccessTokenResponseExtractorFeature<T, C> {
  return {
    kind: AccessTokenFeatureKind.AccessTokenResponseExtractorFeature,
    type: type,
    config: config,
    providers: [],
  };
}

export type AccessTokenFeatures =
  | AccessTokenProviderFeature
  | RenewAccessTokenSourceFeature
  | AccessTokenResponseExtractorFeature;
