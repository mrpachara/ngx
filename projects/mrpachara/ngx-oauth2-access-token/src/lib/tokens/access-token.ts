import { inject, InjectionToken, Injector, isDevMode } from '@angular/core';
import { AccessTokenService } from '../services';
import {
  AccessTokenConfigWithId,
  AccessTokenStorage,
  FetchNewAccessToken,
} from '../types';

/** The injection token for access-token service config */
export const ACCESS_TOKEN_CONFIG = new InjectionToken<AccessTokenConfigWithId>(
  'access-token-config',
);

/** The injection token for access-token storage */
export const ACCESS_TOKEN_STORAGE = new InjectionToken<AccessTokenStorage>(
  'access-token-storage',
);

/** The injection token for fetching new access-token function */
export const FETCH_NEW_ACCESS_TOKEN = new InjectionToken<FetchNewAccessToken>(
  'fetch-new-access-token',
);

/** The injection token for access token services */
export const ACCESS_TOKEN_SERVICES = new InjectionToken<AccessTokenService[]>(
  'access-token-services',
  {
    providedIn: 'root',
    factory: () => [],
  },
);

/**
 * Inject AccessTokenService from the given name.
 *
 * @param id AccessTokenService id symbol.
 * @returns AccessTokenService from the given name.
 * @throws If is not found.
 * @publicApi
 */
export function injectAccessTokenService(
  id: symbol,
  { injector = undefined as Injector | undefined } = {},
): AccessTokenService {
  const services =
    injector?.get(ACCESS_TOKEN_SERVICES) ?? inject(ACCESS_TOKEN_SERVICES);

  const service = services.find((service) => service.id === id);

  if (!service) {
    if (isDevMode()) {
      console.debug('ACCESS_TOKEN_SERVICES', services);
    }

    throw new Error(
      `AccessTokenService '${id.description ?? '[unknown]'}' is not found.`,
    );
  }

  return service;
}
