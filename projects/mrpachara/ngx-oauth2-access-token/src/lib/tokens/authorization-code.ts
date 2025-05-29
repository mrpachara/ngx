import { inject, InjectionToken, Injector, isDevMode } from '@angular/core';
import { AuthorizationCodeService } from '../services';
import { AuthorizationCodeConfig, StateStorage } from '../types';

/** The injection token for authorization-code service config */
export const AUTHORIZATION_CODE_CONFIG =
  new InjectionToken<AuthorizationCodeConfig>('authorization-code-config');

/** The injection token for authorization-code storage */
export const AUTHORIZATION_CODE_STORAGE = new InjectionToken<StateStorage>(
  'authorization-code-storage',
);

/** The injection token for authorization code services */
export const AUTHORIZATION_CODE_SERVICES = new InjectionToken<
  AuthorizationCodeService[]
>('authorization-code-services', {
  providedIn: 'root',
  factory: () => [],
});

/**
 * Inject AuthorizationCodeService from the given name.
 *
 * @param id AuthorizationCodeService id symbol.
 * @returns AuthorizationCodeService from the given name.
 * @throws If is not found.
 * @publicApi
 */
export function injectAuthorizationCodeService(
  id: symbol,
  { injector = undefined as Injector | undefined } = {},
): AuthorizationCodeService {
  const services =
    injector?.get(AUTHORIZATION_CODE_SERVICES) ??
    inject(AUTHORIZATION_CODE_SERVICES);

  const service = services.find((service) => service.id === id);

  if (!service) {
    if (isDevMode()) {
      console.debug('AUTHORIZATION_CODE_SERVICES', services);
    }

    throw new Error(
      `AuthorizationCodeService '${id.description ?? '[unknown]'}' is not found.`,
    );
  }

  return service;
}
