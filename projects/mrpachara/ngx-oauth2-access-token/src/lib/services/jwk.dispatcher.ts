import { inject, Injectable } from '@angular/core';
import { isJwt } from '../helpers';
import { JWK_SERVICES } from '../tokens';
import { JwtInfo, SignedJsonWebInfo } from '../types';
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
   * @param signedJsonWebInfo The signed JSON Web to be verified
   * @returns The `Promise` of `boolean`. It will be `true` for approved and
   *   `false` for refuted
   * @throws `Error` when cannot find the matched JWK service
   * @throws An error from `JwkService.verify()`
   */
  async verify(signedJsonWebInfo: SignedJsonWebInfo): Promise<boolean> {
    const issuer =
      signedJsonWebInfo.header.iss ??
      (isJwt(signedJsonWebInfo) ? signedJsonWebInfo.payload.iss : undefined);

    if (typeof issuer !== 'undefined') {
      const jwtInfo = signedJsonWebInfo as JwtInfo;
      const jwkService = this.findByIssuer(issuer);

      if (jwkService !== null) {
        return await jwkService.verify(jwtInfo);
      }
    }

    throw new Error(`Cannot find JwkService for ${signedJsonWebInfo.token}`, {
      cause: { jsonWeb: signedJsonWebInfo },
    });
  }
}
