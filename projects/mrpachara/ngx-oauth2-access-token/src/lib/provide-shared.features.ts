import { InjectionToken, Provider, Type, inject } from '@angular/core';

import {
  AccessTokenResponse,
  AccessTokenResponseExtractor,
  AccessTokenResponseExtractorInfo,
} from './types';

const prefix = 'shared';

/**
 * Shared provider features must have unique `enum` value. So separate them into
 * shared `enum`.
 */
export enum SharedProviderFeatureKind {
  AccessTokenResponseExtractorFeature = `${prefix}-access-token-response-extractor-feature`,
}

export interface SharedProviderFeature<K extends SharedProviderFeatureKind> {
  readonly kind: K;
  readonly providers: Provider[];
}

/** Access token response extractor feature */
export type AccessTokenResponseExtractorFeature<
  T extends AccessTokenResponse = AccessTokenResponse,
  C = unknown,
> = SharedProviderFeature<SharedProviderFeatureKind.AccessTokenResponseExtractorFeature> & {
  readonly token:
    | Type<AccessTokenResponseExtractor<T, C>>
    | InjectionToken<AccessTokenResponseExtractor<T, C>>;
  readonly fullConfig: C;
  assign(token: InjectionToken<AccessTokenResponseExtractorInfo[]>): void;
};

/**
 * Provide access token response extractor. It can be used repeatedly in both
 * `provideAccessTokenResponseExtractors()` and `provideAccessToken()`. When use
 * it in `provideAccessTokenResponseExtractors()`, it provides globally. But
 * when use it in `provideAccessToken()`, it will be local extractor for that
 * `AccessTokenService`.
 *
 * @param token The injection token or class to be used
 * @param fullConfig The full configuration of extractor.
 * @returns `AccessTokenResponseExtractorFeature`
 */
export function withAccessTokenResponseExtractor<
  T extends AccessTokenResponse,
  C,
>(
  token:
    | Type<AccessTokenResponseExtractor<T, C>>
    | InjectionToken<AccessTokenResponseExtractor<T, C>>,
  fullConfig: C,
): AccessTokenResponseExtractorFeature<T, C> {
  return {
    kind: SharedProviderFeatureKind.AccessTokenResponseExtractorFeature,
    providers: [],
    token,
    fullConfig,
    assign(token) {
      this.providers.splice(0);
      this.providers.push({
        provide: token,
        multi: true,
        useFactory: () => [inject(this.token), this.fullConfig] as const,
      });
    },
  };
}
