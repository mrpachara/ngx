import { JwtInfo } from './oauth2-services.types';
import { JwkBase } from './standard.types';
import { Provided } from './utils.type';

/** The interface for JWT verifier */
export interface JwtVerifier {
  /**
   * Verify the given JWT info with the array of possible JWKs. The verifier
   * **MUST** determine which JWK match its algorithm.
   *
   * @param jwtInfo The given JWT info
   * @param jwks The array of possible JWKs.
   * @returns `Promise` of `boolean` when the verifier can approve or refute JWT
   *   and `undefined` if it cannot.
   */
  verify(
    jwtInfo: Provided<JwtInfo, 'signature'>,
    jwks: JwkBase[],
  ): Promise<boolean | undefined>;
}
