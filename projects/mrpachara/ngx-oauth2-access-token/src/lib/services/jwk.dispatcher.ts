import { inject, Injectable } from '@angular/core';
import { isJwtClaimsPayload } from '../helpers';
import { JWK_SERVICES } from '../tokens';
import { JwtInfo, JwtUnknownInfo } from '../types';
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
   * Find the matched JWK service for the given `jwtUnknownInfo` by using
   * `issuer` of service then verify.
   *
   * @param jwtUnknownInfo The JWT to be verified
   * @returns The `Promise` of `boolean`. It will be `true` for approved and
   *   `false` for refuted
   * @throws `Error` when cannot find the matched JWK service
   * @throws An error from `JwkService.verify()`
   */
  async verify(jwtUnknownInfo: JwtUnknownInfo): Promise<boolean> {
    const issuer =
      jwtUnknownInfo.header.iss ??
      (isJwtClaimsPayload(jwtUnknownInfo)
        ? jwtUnknownInfo.payload.iss
        : undefined);

    if (typeof issuer !== 'undefined') {
      const jwtInfo = jwtUnknownInfo as JwtInfo;
      const jwkService = this.findByIssuer(issuer);

      if (jwkService !== null) {
        return await jwkService.verify(jwtInfo);
      }
    }

    throw new Error(`Cannot find JwkService for ${jwtUnknownInfo.token}`, {
      cause: jwtUnknownInfo,
    });
  }
}
