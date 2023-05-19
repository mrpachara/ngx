import {
  EnvironmentProviders,
  Provider,
  makeEnvironmentProviders,
} from '@angular/core';
import { Observable } from 'rxjs';

import { ACCESS_TOKEN_FULL_CONFIG, RENEW_ACCESS_TOKEN_SOURCE } from './tokens';
import {
  AccessToken,
  AccessTokenConfig,
  AccessTokenFullConfig,
  PickOptional,
} from './types';

const defaultAccessTokenTTL = 10 * 60 * 1000;
const defaultRefreshTokenTTL = 30 * 24 * 60 * 60 * 1000;

const defaultConfig: PickOptional<AccessTokenConfig> = {
  debug: false,
  additionalParams: {},
  accessTokenTTL: defaultAccessTokenTTL,
  refreshTokenTTL: defaultRefreshTokenTTL,
};

export function provideAccessToken(
  config: AccessTokenConfig,
  ...features: AccessTokenFeatures[]
): EnvironmentProviders {
  const fullConfig: AccessTokenFullConfig = {
    ...defaultConfig,
    ...config,
  };

  return makeEnvironmentProviders([
    { provide: ACCESS_TOKEN_FULL_CONFIG, useValue: fullConfig },
    features.map((feature) => feature.providers),
  ]);
}

export enum AccessTokenFeatureKind {
  RenewAccessTokenSourceFeature,
}

export interface AccessTokenFeature<K extends AccessTokenFeatureKind> {
  readonly kind: K;
  readonly providers: Provider[];
}

export type RenewAccessTokenSourceFeature =
  AccessTokenFeature<AccessTokenFeatureKind.RenewAccessTokenSourceFeature>;

export function withRenewAccessTokenSource(
  source: Observable<AccessToken> | (() => Observable<AccessToken>),
): RenewAccessTokenSourceFeature {
  return {
    kind: AccessTokenFeatureKind.RenewAccessTokenSourceFeature,
    providers: [
      {
        provide: RENEW_ACCESS_TOKEN_SOURCE,
        ...(typeof source === 'function'
          ? {
              useFactory: source,
            }
          : {
              useValue: source,
            }),
      },
    ],
  };
}

export type AccessTokenFeatures = RenewAccessTokenSourceFeature;