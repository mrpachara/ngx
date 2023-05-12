import {
  EnvironmentProviders,
  Provider,
  makeEnvironmentProviders,
} from '@angular/core';
import { Observable } from 'rxjs';

import { ACCESS_TOKEN_CONFIG, RENEW_ACCESS_TOKEN_SOURCE } from './tokens';
import { AccessToken, AccessTokenConfig } from './types';

export function provideAccessToken(
  config: AccessTokenConfig,
  ...features: AccessTokenFeatures[]
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: ACCESS_TOKEN_CONFIG, useValue: config },
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
