import {
  IdTokenClaims,
  IdTokenInfo,
} from '@mrpachara/ngx-oauth2-access-token/standard';

export type IdTokenClaimsTransformer = <
  T extends IdTokenClaims = IdTokenClaims,
>(
  oldClaims: T,
  newClaims: T,
) => T;

/** The function for verifying ID Token must throw `Error` when fail. */
export type IdTokenVerification = (idTokenInfo: IdTokenInfo) => Promise<void>;
