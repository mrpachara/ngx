import { Injectable, inject } from '@angular/core';
import { JWK_SERVICES } from '../tokens';
import { JwkService } from '../services';

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
}
