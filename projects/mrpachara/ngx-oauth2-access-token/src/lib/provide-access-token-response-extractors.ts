import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

import {
  AccessTokenResponseExtractorFeature,
  SharedProviderFeatureKind,
} from './provide-shared.features';
import { ACCESS_TOKEN_RESPONSE_EXTRACTOR_INFOS } from './tokens';

/**
 * Provide access token response extractors for using globally.
 *
 * @param features The provider features
 * @returns `EnvironmentProviders`
 */
export function provideAccessTokenResponseExtractors(
  ...features: AccessTokenResponseExtractorsFeatures[]
): EnvironmentProviders {
  // ## FOR ##: AccessTokenResponseExtractorFeature
  features
    .filter(
      (feature): feature is AccessTokenResponseExtractorFeature =>
        feature.kind ===
        SharedProviderFeatureKind.AccessTokenResponseExtractorFeature,
    )
    .forEach((feature) =>
      feature.assign(ACCESS_TOKEN_RESPONSE_EXTRACTOR_INFOS),
    );

  // ## FOR ##: making providers
  return makeEnvironmentProviders([
    features.map((feature) => feature.providers),
  ]);
}

/** All access token response extractors features */
export type AccessTokenResponseExtractorsFeatures =
  AccessTokenResponseExtractorFeature;
