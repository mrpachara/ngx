import { inject, InjectionToken, Injector, isDevMode } from '@angular/core';
import { IdTokenExtractor } from '../services/id-token.extractor';
import { IdTokenStorage } from '../types/storages/id-token';

/** The injection token for ID Token storage */
export const ID_TOKEN_STORAGE = new InjectionToken<IdTokenStorage>(
  'id-token-storage',
);

/** The injection token for ID Token extractors */
export const ID_TOKEN_EXTRACTORS = new InjectionToken<IdTokenExtractor[]>(
  'id-token-extractors',
  {
    providedIn: 'root',
    factory: () => [],
  },
);

/**
 * Inject IdTokenExtractor from the given id.
 *
 * @param id IdTokenExtractor id symbol.
 * @returns IdTokenExtractor from the given id.
 * @throws If is not found.
 * @publicApi
 */
export function injectIdTokenExtractor(
  id: symbol,
  { injector = undefined as Injector | undefined } = {},
): IdTokenExtractor {
  const services =
    injector?.get(ID_TOKEN_EXTRACTORS) ?? inject(ID_TOKEN_EXTRACTORS);

  const service = services.find((service) => service.id === id);

  if (!service) {
    if (isDevMode()) {
      console.debug('ID_TOKEN_EXTRACTORS', services);
    }

    throw new Error(
      `IdTokenExtractor '${id.description ?? '[unknown]'}' is not found.`,
    );
  }

  return service;
}
