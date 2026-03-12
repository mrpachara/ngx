import { InjectionToken } from '@angular/core';
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
