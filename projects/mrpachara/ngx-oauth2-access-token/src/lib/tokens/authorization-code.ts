import { inject, InjectionToken, isDevMode } from '@angular/core';
import { AuthorizationCodeService } from '../services';
import { AuthorizationCodeConfig, StateStorage } from '../types';

/** The injection token for authorization-code service config */
export const AUTHORIZATION_CODE_CONFIG =
  new InjectionToken<AuthorizationCodeConfig>('authorization-code-config');

/** The injection token for authorization-code storage */
export const AUTHORIZATION_CODE_STORAGE = new InjectionToken<StateStorage>(
  'authorization-code-storage',
);

/** The injection token for authorization code tokens */
export const AUTHORIZATION_CODE_SERVICE_TOKENS = new InjectionToken<
  {
    readonly id: symbol;
    readonly token: InjectionToken<AuthorizationCodeService>;
  }[]
>('authorization-code-tokens', {
  providedIn: 'root',
  factory: () => [],
});

/** The injection token for authorization code hierarchized tokens */
export const AUTHORIZATION_CODE_SERVICE_HIERARCHIZED_TOKENS =
  new InjectionToken<
    {
      readonly id: symbol;
      readonly token: InjectionToken<AuthorizationCodeService>;
    }[]
  >('authorization-code-hierarachized-tokens', {
    providedIn: 'root',
    factory: () => [],
  });

/**
 * Inject AuthorizationCodeService from the given id.
 *
 * @param id AuthorizationCodeService id symbol.
 * @returns AuthorizationCodeService from the given id.
 * @throws If is not found.
 * @publicApi
 */
export function injectAuthorizationCodeService(
  id: symbol,
): AuthorizationCodeService {
  const tokenItems = inject(AUTHORIZATION_CODE_SERVICE_HIERARCHIZED_TOKENS);

  const tokenItem = tokenItems.find((tokenItem) => tokenItem.id === id);

  if (!tokenItem) {
    if (isDevMode()) {
      console.debug(
        'AUTHORIZATION_CODE_SERVICE_HIERARCHIZED_TOKENS',
        tokenItems,
      );
    }

    throw new Error(
      `AuthorizationCodeService '${id.description ?? '[unknown]'}' is not found.`,
    );
  }

  return inject(tokenItem.token);
}
