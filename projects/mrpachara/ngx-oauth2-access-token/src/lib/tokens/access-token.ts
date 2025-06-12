import { inject, InjectionToken, isDevMode } from '@angular/core';
import { AccessTokenService } from '../services';
import {
  AccessTokenConfig,
  AccessTokenResponseExtractor,
  AccessTokenStorage,
} from '../types';

/** The injection token for access-token service config */
export const ACCESS_TOKEN_CONFIG = new InjectionToken<AccessTokenConfig>(
  'access-token-config',
);

/** The injection token for access-token storage */
export const ACCESS_TOKEN_STORAGE = new InjectionToken<AccessTokenStorage>(
  'access-token-storage',
);

/** The injection token for extractor ID */
export const EXTRACTOR_ID = new InjectionToken<symbol>('extractor-id');

/** The injection token for access-token storage */
export const ACCESS_TOKEN_RESPONSE_EXTRACTORS = new InjectionToken<
  AccessTokenResponseExtractor[]
>('access-token-response-extractors');

/** The injection token for access token service tokens */
export const ACCESS_TOKEN_SERVICE_TOKENS = new InjectionToken<
  {
    readonly id: symbol;
    readonly token: InjectionToken<AccessTokenService>;
  }[]
>('access-token-service-tokens', {
  providedIn: 'root',
  factory: () => [],
});

/** The injection token for access token service hierarchized tokens */
export const ACCESS_TOKEN_SERVICE_HIERARCHIZED_TOKENS = new InjectionToken<
  {
    readonly id: symbol;
    readonly token: InjectionToken<AccessTokenService>;
  }[]
>('access-token-service-hierarchized-tokens', {
  providedIn: 'root',
  factory: () => [],
});

/**
 * Inject AccessTokenService from the given name.
 *
 * @param id AccessTokenService id symbol.
 * @returns AccessTokenService from the given name.
 * @throws If is not found.
 * @publicApi
 */
export function injectAccessTokenService(id: symbol): AccessTokenService {
  const tokenItems = inject(ACCESS_TOKEN_SERVICE_HIERARCHIZED_TOKENS);

  const tokenItem = tokenItems.find((tokenItem) => tokenItem.id === id);

  if (!tokenItem) {
    if (isDevMode()) {
      console.debug('ACCESS_TOKEN_SERVICE_HIERARCHIZED_TOKENS', tokenItems);
    }

    throw new Error(
      `AccessTokenService '${id.description ?? '[unknown]'}' is not found.`,
    );
  }

  return inject(tokenItem.token);
}
