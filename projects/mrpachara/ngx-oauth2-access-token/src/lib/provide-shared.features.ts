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

export type AccessTokenResponseExtractorFeature<
  T extends AccessTokenResponse = AccessTokenResponse,
  C = unknown,
> = SharedProviderFeature<SharedProviderFeatureKind.AccessTokenResponseExtractorFeature> & {
  type: Type<AccessTokenResponseExtractor<T, C>>;
  config: C;
  assign(
    token:
      | Type<AccessTokenResponseExtractorInfo[]>
      | InjectionToken<AccessTokenResponseExtractorInfo[]>,
  ): void;
};

export function withAccessTokenResponseExtractor<
  T extends AccessTokenResponse,
  C,
>(
  type: Type<AccessTokenResponseExtractor<T, C>>,
  config: C,
): AccessTokenResponseExtractorFeature<T, C> {
  return {
    kind: SharedProviderFeatureKind.AccessTokenResponseExtractorFeature,
    type: type,
    config: config,
    providers: [],
    assign(
      token:
        | Type<AccessTokenResponseExtractorInfo[]>
        | InjectionToken<AccessTokenResponseExtractorInfo[]>,
    ): void {
      this.providers.push({
        provide: token,
        multi: true,
        useFactory: () => [inject(this.type), this.config] as const,
      });
    },
  };
}
