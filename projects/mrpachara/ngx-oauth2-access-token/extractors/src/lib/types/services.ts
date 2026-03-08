import { IdTokenClaims, IdTokenInfo } from '@mrpachara/ngx-oauth2-access-token';

export type IdTokenClaimsTransformer = <
  T extends IdTokenClaims = IdTokenClaims,
>(
  oldClaims: T,
  newClaims: T,
) => T;

export type IdTokenVerification = (idTokenInfo: IdTokenInfo) => Promise<void>;
