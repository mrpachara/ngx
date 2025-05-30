import { JwsInfo, JwtInfo } from '../jose-info';
import { Jwk } from '../standards';

/** JWT over JWS verifier */
export type JwtVerifier = (
  jwtOverJwsInfo: Extract<JwtInfo, JwsInfo>,
  jwks: Jwk[],
) => Promise<boolean | undefined>;
