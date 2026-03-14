import {
  Jwk,
  JwsInfo,
  JwtInfo,
} from '@mrpachara/ngx-oauth2-access-token/standard';

/** JWT over JWS verifier */
export type JwtVerifier = (
  jwtOverJwsInfo: Extract<JwtInfo, JwsInfo>,
  jwks: Jwk[],
) => Promise<boolean | undefined>;
