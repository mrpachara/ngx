import { Injectable, inject } from '@angular/core';
import { ACCESS_TOKEN_SERVICES } from '../tokens';
import { AccessTokenService } from '../services';

@Injectable({
  providedIn: 'root',
})
export class AccessTokenServiceResolver {
  private readonly accessTokenServices = inject(ACCESS_TOKEN_SERVICES);

  find(name: string): AccessTokenService | null {
    for (const accessTokenService of this.accessTokenServices) {
      if (accessTokenService.name === name) {
        return accessTokenService;
      }
    }

    return null;
  }
}
