import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

import {
  AccessTokenResponseExtractorFeature,
  SharedProviderFeatureKind,
} from './provide-shared.features';
import { ACCESS_TOKEN_RESPONSE_EXTRACTOR_INFOS } from './tokens';

export function provideAccessTokenResponseExtractors(
  ...features: AccessTokenResponseExtractorsFeatures[]
): EnvironmentProviders {
  features
    .filter(
      (feature): feature is AccessTokenResponseExtractorFeature =>
        feature.kind ===
        SharedProviderFeatureKind.AccessTokenResponseExtractorFeature,
    )
    .forEach((feature) =>
      feature.assign(ACCESS_TOKEN_RESPONSE_EXTRACTOR_INFOS),
    );

  return makeEnvironmentProviders([
    features.map((feature) => feature.providers),
  ]);
}

export type AccessTokenResponseExtractorsFeatures =
  AccessTokenResponseExtractorFeature;
