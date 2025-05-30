import { inject, Injectable } from '@angular/core';
import { MatchedIssuerNotFoundError, NonprovidedIssuerError } from '../errors';
import { JWK_SERVICES } from '../tokens';
import { JwsInfo, JwtInfo } from '../types';
import { JwkService } from './jwk.service';

/** JWK Dispatcher */
@Injectable()
export class JwkDispatcher {
  private readonly jwkServices = inject(JWK_SERVICES);

  /**
   * Find a JWK service from the given `issuer`.
   *
   * @param issuer The issuer for finding
   * @returns The JWK service or `null` when not found
   */
  findByIssuer(issuer: string): JwkService | null {
    for (const jwkService of this.jwkServices) {
      if (jwkService.issuer === issuer) {
        return jwkService;
      }
    }

    return null;
  }

  /**
   * Find the matched JWK service for the given `jwtInfo` by using `issuer` of
   * service then verify.
   *
   * @param jwtOverJwsInfo The JWT over JWS to be verified
   * @returns The `Promise` of `boolean`. It will be `true` for approved and
   *   `false` for refuted
   * @throws NonprovidedIssuerError | MatchedIssuerNotFoundError
   * @throws From JwKService
   */
  async verify(jwtOverJwsInfo: Extract<JwtInfo, JwsInfo>): Promise<boolean> {
    const issuer = jwtOverJwsInfo.header.iss ?? jwtOverJwsInfo.payload.iss;

    if (typeof issuer === 'undefined') {
      throw new NonprovidedIssuerError(jwtOverJwsInfo);
    }

    const jwkService = this.findByIssuer(issuer);

    if (jwkService !== null) {
      return await jwkService.verify(jwtOverJwsInfo);
    }

    throw new MatchedIssuerNotFoundError(issuer);
  }
}
