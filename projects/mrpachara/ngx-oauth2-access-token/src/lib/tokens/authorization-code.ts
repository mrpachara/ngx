import {
  inject,
  InjectionToken,
  InjectOptions,
  isDevMode,
} from '@angular/core';
import { AuthorizationCodeService } from '../services';
import { AuthorizationCodeConfig, StateStorage } from '../types';
import { IdKey } from './common';
import { AUTHORIZATION_CODE_SERVICE_HIERARCHIZED_TOKENS } from './internal/authorization-code';

/** The injection token for authorization-code service config */
export const AUTHORIZATION_CODE_CONFIG =
  new InjectionToken<AuthorizationCodeConfig>('authorization-code-config');

/** The injection token for authorization-code storage */
export const AUTHORIZATION_CODE_STORAGE = new InjectionToken<StateStorage>(
  'authorization-code-storage',
);

/**
 * Inject AuthorizationCodeService from the given id.
 *
 * @param id AuthorizationCodeService id.
 * @returns AuthorizationCodeService from the given id.
 * @throws If is not found.
 * @publicApi
 */
export function injectAuthorizationCodeService(
  id: IdKey,
): AuthorizationCodeService;

/**
 * Inject AuthorizationCodeService from the given id.
 *
 * @param id AuthorizationCodeService id.
 * @param options Control how injection is executed. Options correspond to
 *   injection strategies that can be specified with parameter decorators
 *   `@Host`, `@Self`, `@SkipSelf`, and `@Optional`.
 * @returns AuthorizationCodeService from the given id.
 * @throws If is not found.
 * @publicApi
 */
export function injectAuthorizationCodeService(
  id: IdKey,
  options: InjectOptions & {
    optional?: false;
  },
): AuthorizationCodeService;

/**
 * Inject AuthorizationCodeService from the given id.
 *
 * @param id AuthorizationCodeService id.
 * @param options Control how injection is executed. Options correspond to
 *   injection strategies that can be specified with parameter decorators
 *   `@Host`, `@Self`, `@SkipSelf`, and `@Optional`.
 * @returns AuthorizationCodeService from the given id, `null` if the token is
 *   not found.
 * @throws If is not found.
 * @publicApi
 */
export function injectAuthorizationCodeService(
  id: IdKey,
  options: InjectOptions,
): AuthorizationCodeService | null;

export function injectAuthorizationCodeService(
  id: IdKey,
  options?: InjectOptions,
): AuthorizationCodeService | null {
  const tokenItems = inject(AUTHORIZATION_CODE_SERVICE_HIERARCHIZED_TOKENS);

  const tokenItem = tokenItems.find((tokenItem) => tokenItem.id === id);

  if (!tokenItem) {
    if (isDevMode()) {
      console.debug(
        'AUTHORIZATION_CODE_SERVICE_HIERARCHIZED_TOKENS',
        tokenItems,
      );
    }

    throw new Error(`AuthorizationCodeService '${id}' is not found.`);
  }

  if (typeof options === 'undefined') {
    return inject(tokenItem.token);
  } else {
    return inject(tokenItem.token, options);
  }
}
