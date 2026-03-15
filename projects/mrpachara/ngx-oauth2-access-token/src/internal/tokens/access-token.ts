import {
  inject,
  InjectionToken,
  InjectOptions,
  isDevMode,
} from '@angular/core';
import { AccessTokenService } from '../../lib/services';
import { IdKey } from '../../lib/tokens';

/** The injection token for access token service tokens */
export const ACCESS_TOKEN_SERVICE_TOKENS = new InjectionToken<
  {
    readonly id: IdKey;
    readonly token: InjectionToken<AccessTokenService>;
  }[]
>('access-token-service-tokens', {
  providedIn: 'root',
  factory: () => [],
});

/** The injection token for access token service hierarchized tokens */
export const ACCESS_TOKEN_SERVICE_HIERARCHIZED_TOKENS = new InjectionToken<
  {
    readonly id: IdKey;
    readonly token: InjectionToken<AccessTokenService>;
  }[]
>('access-token-service-hierarchized-tokens', {
  providedIn: 'root',
  factory: () => [],
});

/**
 * Inject AccessTokenService from the given name.
 *
 * @param id AccessTokenService id.
 * @returns AccessTokenService from the given name.
 * @throws If is not found.
 * @publicApi
 */
export function injectAccessTokenService(id: IdKey): AccessTokenService;

/**
 * Inject AccessTokenService from the given name.
 *
 * @param id AccessTokenService id.
 * @param options Control how injection is executed. Options correspond to
 *   injection strategies that can be specified with parameter decorators
 *   `@Host`, `@Self`, `@SkipSelf`, and `@Optional`.
 * @returns AccessTokenService from the given name.
 * @throws If is not found.
 * @publicApi
 */
export function injectAccessTokenService(
  id: IdKey,
  options: InjectOptions & {
    optional?: false;
  },
): AccessTokenService;

/**
 * Inject AccessTokenService from the given name.
 *
 * @param id AccessTokenService id.
 * @param options Control how injection is executed. Options correspond to
 *   injection strategies that can be specified with parameter decorators
 *   `@Host`, `@Self`, `@SkipSelf`, and `@Optional`.
 * @returns AccessTokenService from the given name, `null` if the token is not
 *   found.
 * @throws If is not found.
 * @publicApi
 */
export function injectAccessTokenService(
  id: IdKey,
  options: InjectOptions,
): AccessTokenService | null;

export function injectAccessTokenService(
  id: IdKey,
  options?: InjectOptions,
): AccessTokenService | null {
  const tokenItems = inject(ACCESS_TOKEN_SERVICE_HIERARCHIZED_TOKENS);

  const tokenItem = tokenItems.find((tokenItem) => tokenItem.id === id);

  if (!tokenItem) {
    if (isDevMode()) {
      console.debug(
        `ACCESS_TOKEN_SERVICE_HIERARCHIZED_TOKENS:${id}`,
        tokenItems,
      );
    }

    throw new Error(`AccessTokenService '${id}' is not found.`);
  }

  if (typeof options === 'undefined') {
    return inject(tokenItem.token);
  } else {
    return inject(tokenItem.token, options);
  }
}
