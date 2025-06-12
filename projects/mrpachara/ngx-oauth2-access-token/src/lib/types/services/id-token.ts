import { IdTokenInfo } from '../jose-info';
import { IdTokenClaims } from '../standards';

export type IdTokenClaimsTransformer = <
  T extends IdTokenClaims = IdTokenClaims,
>(
  oldClaims: T,
  newClaims: T,
) => T;

export type IdTokenVerification = (idTokenInfo: IdTokenInfo) => Promise<void>;
