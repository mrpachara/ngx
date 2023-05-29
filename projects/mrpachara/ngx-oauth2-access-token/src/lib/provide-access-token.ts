import {
  EnvironmentProviders,
  Provider,
  makeEnvironmentProviders,
} from '@angular/core';
import { Observable } from 'rxjs';

import {
  ACCESS_TOKEN_FULL_CONFIG,
  ACCESS_TOKEN_RESPONSE_LISTENERS,
  RENEW_ACCESS_TOKEN_SOURCE,
} from './tokens';
import {
  AccessTokenConfig,
  AccessTokenFullConfig,
  AccessTokenResponse,
  PickOptional,
} from './types';
import { RefreshTokenService } from './refresh-token.service';

const defaultAccessTokenTtl = 10 * 60 * 1000;
const defaultRefreshTokenTtl = 30 * 24 * 60 * 60 * 1000;

const defaultConfig: PickOptional<AccessTokenConfig> = {
  debug: false,
  additionalParams: {},
  accessTokenTtl: defaultAccessTokenTtl,
  refreshTokenTtl: defaultRefreshTokenTtl,
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
    {
      provide: ACCESS_TOKEN_RESPONSE_LISTENERS,
      multi: true,
      useExisting: RefreshTokenService,
    },
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

export type AccessTokenFeatures = RenewAccessTokenSourceFeature;
