import {
  EnvironmentProviders,
  Provider,
  Type,
  makeEnvironmentProviders,
} from '@angular/core';

import { generateAccessTokenResponseExtractorProvider } from './provide-helper.functions';
import { ACCESS_TOKEN_RESPONSE_EXTRACTOR_INFOS } from './tokens';
import { AccessTokenResponse, AccessTokenResponseExtractor } from './types';

export function provideAccessTokenResponseExtractors(
  ...features: AccessTokenResponseExtractorsFeatures[]
): EnvironmentProviders {
  features
    .filter(
      (feature): feature is AccessTokenResponseExtractorFeature =>
        feature.kind ===
        AccessTokenResponseExtractorsFeatureKind.AccessTokenResponseExtractorFeature,
    )
    .forEach(
      generateAccessTokenResponseExtractorProvider(
        ACCESS_TOKEN_RESPONSE_EXTRACTOR_INFOS,
      ),
    );

  return makeEnvironmentProviders([
    features.map((feature) => feature.providers),
  ]);
}

export enum AccessTokenResponseExtractorsFeatureKind {
  // NOTE: This is a shared feature. Make it be unquie.
  AccessTokenResponseExtractorFeature = 'access-token-response-extractor-feature',
}

export interface AccessTokenResponseExtractorsFeature<
  K extends AccessTokenResponseExtractorsFeatureKind,
> {
  readonly kind: K;
  readonly providers: Provider[];
}

export type AccessTokenResponseExtractorFeature<
  T extends AccessTokenResponse = AccessTokenResponse,
  C = unknown,
> = AccessTokenResponseExtractorsFeature<AccessTokenResponseExtractorsFeatureKind.AccessTokenResponseExtractorFeature> & {
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
    kind: AccessTokenResponseExtractorsFeatureKind.AccessTokenResponseExtractorFeature,
    type: type,
    config: config,
    providers: [],
  };
}

export type AccessTokenResponseExtractorsFeatures =
  AccessTokenResponseExtractorFeature;
