import {
  EnvironmentProviders,
  ExistingProvider,
  FactoryProvider,
  InjectionToken,
  Provider,
  Type,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import { Observable } from 'rxjs';

import { configAccessToken } from './helpers';
import {
  AccessTokenResponseExtractorFeature,
  SharedProviderFeatureKind,
} from './provide-shared.features';
import { AccessTokenService, Oauth2Client } from './services';
import { ACCESS_TOKEN_SERVICES } from './tokens';
import {
  AccessTokenConfig,
  AccessTokenFullConfig,
  AccessTokenResponse,
  AccessTokenResponseExtractorInfo,
} from './types';

/**
 * Provide access token service and its features. For creating multiple access
 * token services, use `provideAccessToken()` multiple times with
 * `withAccessTokenProvider()` feature, e.g.:
 *
 * ```typescript
 * provideAccessToken(configA),
 * provideAccessToken(
 *   configB,
 *   withAccessTokenProvider(
 *     ACCESS_TOKEN_SERVICE_B,
 *     (
 *       fullConfigB,
 *       extractorInfosB,
 *       renewAccessTokenSourceB,
 *     ) => new AccessTokenService(
 *       fullConfig,
 *       extractorInfos,
 *       renewAccessTokenSource,
 *       inject(OAUTH2_CLIENT_B),
 *     ),
 *   ),
 * ),
 * ```
 *
 * @param config The configuration of service
 * @param features The provider features
 * @returns `EnvironmentProviders`
 */
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

  const renewAccessTokenSourceToken = new InjectionToken<
    Observable<AccessTokenResponse>
  >(`renew-access-token-source-${fullConfig.name}`);

  const extractorInfosToken = new InjectionToken<
    AccessTokenResponseExtractorInfo[]
  >(`access-token-extractor-infos-${fullConfig.name}`, {
    providedIn: 'root',
    factory: () => [],
  });

  // ## FOR ##: normalizing featrues
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
    features.push(
      withAccessTokenProvider(
        AccessTokenService,
        (fullConfig, extractorInfos, renewAccessTokenSource) =>
          new AccessTokenService(
            fullConfig,
            extractorInfos,
            renewAccessTokenSource,
            inject(Oauth2Client),
          ),
      ),
    );
  }

  // ## FOR ##: RenewAccessTokenSourceFeature
  features
    .filter(
      (feature): feature is RenewAccessTokenSourceFeature =>
        feature.kind === AccessTokenFeatureKind.RenewAccessTokenSourceFeature,
    )
    .forEach((feature) => feature.assign(renewAccessTokenSourceToken));

  // ## FOR ##: AccessTokenResponseExtractorFeature
  features
    .filter(
      (feature): feature is AccessTokenResponseExtractorFeature =>
        feature.kind ===
        SharedProviderFeatureKind.AccessTokenResponseExtractorFeature,
    )
    .forEach((feature) => feature.assign(extractorInfosToken));

  // ## FOR ##: AccessTokenProviderFeature
  features
    .filter(
      (feature): feature is AccessTokenProviderFeature =>
        feature.kind === AccessTokenFeatureKind.AccessTokenProviderFeature,
    )
    .forEach((feature) =>
      feature.assign(
        fullConfigToken,
        extractorInfosToken,
        renewAccessTokenSourceToken,
      ),
    );

  // ## FOR ##: making providers
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

/** Access token service provider feature */
export type AccessTokenProviderFeature<
  T extends AccessTokenService = AccessTokenService,
> = AccessTokenFeature<AccessTokenFeatureKind.AccessTokenProviderFeature> & {
  readonly token: Type<T> | InjectionToken<T>;
  readonly factory: (
    config: AccessTokenFullConfig,
    extractorInfos: AccessTokenResponseExtractorInfo[],
    renewAccessTokenSource: Observable<AccessTokenResponse> | null,
  ) => T;
  assign(
    fullConfigToken: InjectionToken<AccessTokenFullConfig>,
    extractorInfosToken: InjectionToken<AccessTokenResponseExtractorInfo[]>,
    renewAccessTokenSourceToken: InjectionToken<
      Observable<AccessTokenResponse>
    >,
  ): void;
};

/**
 * Provide another `AccessTokenService` than the default one.
 *
 * @param token The injection token or class to be used
 * @param factory The factory for creating instance
 * @returns `AccessTokenProviderFeature`
 */
export function withAccessTokenProvider<T extends AccessTokenService>(
  token: Type<T> | InjectionToken<T>,
  factory: (
    config: AccessTokenFullConfig,
    extractorInfos: AccessTokenResponseExtractorInfo[],
    renewAccessTokenSource: Observable<AccessTokenResponse> | null,
  ) => T,
): AccessTokenProviderFeature {
  return {
    kind: AccessTokenFeatureKind.AccessTokenProviderFeature,
    providers: [],
    token,
    factory,
    assign(fullConfigToken, extractorInfosToken, renewAccessTokenSourceToken) {
      this.providers.splice(0);
      this.providers.push(
        {
          provide: this.token,
          useFactory: () =>
            this.factory(
              inject(fullConfigToken),
              inject(extractorInfosToken),
              inject(renewAccessTokenSourceToken, { optional: true }),
            ),
        } as FactoryProvider,
        {
          provide: ACCESS_TOKEN_SERVICES,
          multi: true,
          useExisting: this.token,
        } as ExistingProvider,
      );
    },
  };
}

/** Renew access token source feature */
export type RenewAccessTokenSourceFeature =
  AccessTokenFeature<AccessTokenFeatureKind.RenewAccessTokenSourceFeature> & {
    assign(token: InjectionToken<Observable<AccessTokenResponse>>): void;
  };

/**
 * Provide a renew access toke resource.
 *
 * @param sourceFactory The source factory
 * @returns `RenewAccessTokenSourceFeature`
 */
export function withRenewAccessTokenSource(
  sourceFactory: () => Observable<AccessTokenResponse>,
): RenewAccessTokenSourceFeature {
  return {
    kind: AccessTokenFeatureKind.RenewAccessTokenSourceFeature,
    providers: [],
    assign(token): void {
      this.providers.splice(0);
      this.providers.push({
        provide: token,
        useFactory: sourceFactory,
      } as FactoryProvider);
    },
  };
}

/** All access token features */
export type AccessTokenFeatures =
  | AccessTokenProviderFeature
  | RenewAccessTokenSourceFeature
  | AccessTokenResponseExtractorFeature;
