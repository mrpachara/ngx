import { Injectable, inject } from '@angular/core';
import { JWK_SERVICES } from '../tokens';
import { JwkService } from '../services';
import { JwtInfo, JwtUnknownInfo } from '../types';
import { isJwtClaimsPayload } from '../functions';

@Injectable({
  providedIn: 'root',
})
export class JwkServiceResolver {
  private readonly jwkServices = inject(JWK_SERVICES);

  find(name: string): JwkService | null {
    for (const jwkService of this.jwkServices) {
      if (jwkService.name === name) {
        return jwkService;
      }
    }

    return null;
  }

  findByIssuer(issuer: string): JwkService | null {
    for (const jwkService of this.jwkServices) {
      if (jwkService.issuer === issuer) {
        return jwkService;
      }
    }

    return null;
  }

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
