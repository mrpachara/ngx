import {
  EnvironmentProviders,
  InjectionToken,
  Provider,
  Type,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import { Observable } from 'rxjs';

import { configAccessToken } from './functions';
import {
  AccessTokenResponseExtractorFeature,
  SharedProviderFeatureKind,
} from './provide-shared.features';
import { AccessTokenService, Oauth2Client } from './services';
import { ACCESS_TOKEN_SERVICES, RENEW_ACCESS_TOKEN_SOURCE } from './tokens';
import {
  AccessTokenConfig,
  AccessTokenFullConfig,
  AccessTokenResponse,
  AccessTokenResponseExtractorInfo,
} from './types';

export function provideAccessToken(
  config: AccessTokenConfig,
  ...features: AccessTokenFeatures[]
): EnvironmentProviders {
  const fullConfig = configAccessToken(config);

  const fullConfigToken = new InjectionToken<AccessTokenFullConfig>(
    `access-token-full-config-${fullConfig.name}`,
    {
      providedIn: 'root',
      factory: () => fullConfig,
    },
  );

  const extractorInfosToken = new InjectionToken<
    AccessTokenResponseExtractorInfo[]
  >(`access-token-extractor-infos-${fullConfig.name}`, {
    providedIn: 'root',
    factory: () => [],
  });

  const providerFeatures = features.filter(
    (feature): feature is AccessTokenProviderFeature =>
      feature.kind === AccessTokenFeatureKind.AccessTokenProviderFeature,
  );

  if (providerFeatures.length > 1) {
    throw new Error(
      'Only one accessTokenProvider feature is allowed for each AccessToken!',
    );
  }

  if (providerFeatures.length === 0) {
    features.push({
      kind: AccessTokenFeatureKind.AccessTokenProviderFeature,
      providers: [],
      injectionToken: AccessTokenService,
      factory: (fullConfig, extractorInfos) =>
        new AccessTokenService(
          fullConfig,
          inject(Oauth2Client),
          extractorInfos,
          inject(RENEW_ACCESS_TOKEN_SOURCE, { optional: true }),
        ),
    });
  }

  features
    .filter(
      (feature): feature is AccessTokenProviderFeature =>
        feature.kind === AccessTokenFeatureKind.AccessTokenProviderFeature,
    )
    .forEach((feature) =>
      feature.providers.push(
        {
          provide: feature.injectionToken,
          useFactory: () =>
            feature.factory(
              inject(fullConfigToken),
              inject(extractorInfosToken),
            ),
        },
        {
          provide: ACCESS_TOKEN_SERVICES,
          multi: true,
          useExisting: feature.injectionToken,
        },
      ),
    );

  features
    .filter(
      (feature): feature is AccessTokenResponseExtractorFeature =>
        feature.kind ===
        SharedProviderFeatureKind.AccessTokenResponseExtractorFeature,
    )
    .forEach((feature) => feature.assign(extractorInfosToken));

  return makeEnvironmentProviders([
    features.map((feature) => feature.providers),
  ]);
}

export enum AccessTokenFeatureKind {
  AccessTokenProviderFeature,
  RenewAccessTokenSourceFeature,
}

export interface AccessTokenFeature<K extends AccessTokenFeatureKind> {
  readonly kind: K;
  readonly providers: Provider[];
}

export type AccessTokenProviderFeature<
  T extends AccessTokenService = AccessTokenService,
> = AccessTokenFeature<AccessTokenFeatureKind.AccessTokenProviderFeature> & {
  injectionToken: Type<T> | InjectionToken<T>;
  factory: (
    config: AccessTokenFullConfig,
    extractorInfos: AccessTokenResponseExtractorInfo[],
  ) => T;
};

export function withAccessTokenProvider<T extends AccessTokenService>(
  injectionToken: Type<T> | InjectionToken<T>,
  factory: (
    config: AccessTokenFullConfig,
    extractorInfos: AccessTokenResponseExtractorInfo[],
  ) => T,
): AccessTokenProviderFeature {
  return {
    kind: AccessTokenFeatureKind.AccessTokenProviderFeature,
    providers: [],
    injectionToken,
    factory,
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

export type AccessTokenFeatures =
  | AccessTokenProviderFeature
  | RenewAccessTokenSourceFeature
  | AccessTokenResponseExtractorFeature;
