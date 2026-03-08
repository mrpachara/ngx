import {
  inject,
  InjectionToken,
  InjectOptions,
  isDevMode,
} from '@angular/core';
import { IdKey } from '@mrpachara/ngx-oauth2-access-token';
import { IdTokenExtractor } from './services';
import {
  IdTokenClaimsTransformer,
  IdTokenStorage,
  IdTokenVerification,
} from './types';

/** The injection token for ID Token storage */
export const ID_TOKEN_STORAGE = new InjectionToken<IdTokenStorage>(
  'id-token-storage',
);

/** The injection token for claims transformer */
export const ID_TOKEN_CLAIMS_TRANSFORMER =
  new InjectionToken<IdTokenClaimsTransformer>('id-token-claims-transformer', {
    providedIn: 'root',
    factory: () => (_, newClaims) => newClaims,
  });

/** The injection token for verification */
export const ID_TOKEN_VERIFICATION = new InjectionToken<IdTokenVerification>(
  'id-token-verification',
  {
    providedIn: 'root',
    factory: () => async () => {
      /* empty */
    },
  },
);

/** The injection token for ID Token extractor tokens */
export const ID_TOKEN_EXTRACTOR_TOKENS = new InjectionToken<
  {
    readonly id: IdKey;
    readonly token: InjectionToken<IdTokenExtractor>;
  }[]
>('id-token-extractor-tokens', {
  providedIn: 'root',
  factory: () => [],
});

/** The injection token for ID Token extractor hierarchized tokens */
export const ID_TOKEN_EXTRACTORE_HIERARCHIZED_TOKENS = new InjectionToken<
  {
    readonly id: IdKey;
    readonly token: InjectionToken<IdTokenExtractor>;
  }[]
>('id-token-extractor-hierarchized-tokens', {
  providedIn: 'root',
  factory: () => [],
});

/**
 * Inject IdTokenExtractor from the given id.
 *
 * @param id IdTokenExtractor id.
 * @returns IdTokenExtractor from the given id.
 * @throws If is not found.
 * @publicApi
 */
export function injectIdTokenExtractor(id: IdKey): IdTokenExtractor;

/**
 * Inject IdTokenExtractor from the given id.
 *
 * @param id IdTokenExtractor id.
 * @param options Control how injection is executed. Options correspond to
 *   injection strategies that can be specified with parameter decorators
 *   `@Host`, `@Self`, `@SkipSelf`, and `@Optional`.
 * @returns IdTokenExtractor from the given id.
 * @throws If is not found.
 * @publicApi
 */
export function injectIdTokenExtractor(
  id: IdKey,
  options: InjectOptions & {
    optional?: false;
  },
): IdTokenExtractor;

/**
 * Inject IdTokenExtractor from the given id.
 *
 * @param id IdTokenExtractor id.
 * @param options Control how injection is executed. Options correspond to
 *   injection strategies that can be specified with parameter decorators
 *   `@Host`, `@Self`, `@SkipSelf`, and `@Optional`.
 * @returns IdTokenExtractor from the given id, `null` if the token is not
 *   found.
 * @throws If is not found.
 * @publicApi
 */
export function injectIdTokenExtractor(
  id: IdKey,
  options: InjectOptions,
): IdTokenExtractor | null;

export function injectIdTokenExtractor(
  id: IdKey,
  options?: InjectOptions,
): IdTokenExtractor | null {
  const tokenItems = inject(ID_TOKEN_EXTRACTORE_HIERARCHIZED_TOKENS);

  const tokenItem = tokenItems.find((tokenItem) => tokenItem.id === id);

  if (!tokenItem) {
    if (isDevMode()) {
      console.debug('ID_TOKEN_EXTRACTORE_HIERARCHIZED_TOKENS', tokenItems);
    }

    throw new Error(`IdTokenExtractor '${id}' is not found.`);
  }

  if (typeof options === 'undefined') {
    return inject(tokenItem.token);
  } else {
    return inject(tokenItem.token, options);
  }
}
