import { inject, InjectionToken, isDevMode } from '@angular/core';
import { IdTokenExtractor } from '../services/id-token.extractor';
import { IdTokenClaimsTransformer, IdTokenVerification } from '../types';
import { IdTokenStorage } from '../types/storages/id-token';

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
    readonly id: symbol;
    readonly token: InjectionToken<IdTokenExtractor>;
  }[]
>('id-token-extractor-tokens', {
  providedIn: 'root',
  factory: () => [],
});

/** The injection token for ID Token extractor hierarchized tokens */
export const ID_TOKEN_EXTRACTORE_HIERARCHIZED_TOKENS = new InjectionToken<
  {
    readonly id: symbol;
    readonly token: InjectionToken<IdTokenExtractor>;
  }[]
>('id-token-extractor-hierarchized-tokens', {
  providedIn: 'root',
  factory: () => [],
});

/**
 * Inject IdTokenExtractor from the given id.
 *
 * @param id IdTokenExtractor id symbol.
 * @returns IdTokenExtractor from the given id.
 * @throws If is not found.
 * @publicApi
 */
export function injectIdTokenExtractor(id: symbol): IdTokenExtractor {
  const tokenItems = inject(ID_TOKEN_EXTRACTORE_HIERARCHIZED_TOKENS);

  const tokenItem = tokenItems.find((tokenItem) => tokenItem.id === id);

  if (!tokenItem) {
    if (isDevMode()) {
      console.debug('ID_TOKEN_EXTRACTORE_HIERARCHIZED_TOKENS', tokenItems);
    }

    throw new Error(
      `IdTokenExtractor '${id.description ?? '[unknown]'}' is not found.`,
    );
  }

  return inject(tokenItem.token);
}
