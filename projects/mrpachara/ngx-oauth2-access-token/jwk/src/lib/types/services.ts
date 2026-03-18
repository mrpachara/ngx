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

export interface JwkOperations {
  /**
   * The issuer for the operations. It is used for matching the service by
   * `issuer` of JWT over JWS information.
   */
  readonly issuer: string;

  /**
   * Verify the given JWT over JWS information.
   *
   * @param jwtOverJwsInfo The JWT over JWS information
   * @returns The `Promise` of `boolean`. It will be `true` for approved and
   *   `false` for refuted
   * @throws `MatchedJwkNotFoundError` when matched JWKs from the loaded JWK Set
   *   are not found
   * @throws `SupportedJwkAlgNotFoundError` when supported algorithm is not
   *   found
   */
  verify(jwtOverJwsInfo: Extract<JwtInfo, JwsInfo>): Promise<boolean>;
}
