import { InjectionToken, Type, inject } from '@angular/core';

import { AccessTokenResponseExtractorFeature } from './provide-access-token-response-extractors';
import { AccessTokenResponseExtractorInfo } from './types';

export function generateAccessTokenResponseExtractorProvider(
  injectionToken:
    | Type<AccessTokenResponseExtractorInfo[]>
    | InjectionToken<AccessTokenResponseExtractorInfo[]>,
): (feature: AccessTokenResponseExtractorFeature) => void {
  return (feature: AccessTokenResponseExtractorFeature) => {
    console.debug(feature);
    feature.providers.push({
      provide: injectionToken,
      multi: true,
      useFactory: () => [inject(feature.type), feature.config] as const,
    });
  };
}
