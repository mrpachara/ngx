import { Injectable, inject } from '@angular/core';
import { ACCESS_TOKEN_SERVICES } from '../tokens';
import { AccessTokenService } from '../services';

/** Access token service resolver */
@Injectable({
  providedIn: 'root',
})
export class AccessTokenServiceResolver {
  private readonly accessTokenServices = inject(ACCESS_TOKEN_SERVICES);

  /**
   * Find an access token service from the given `name`.
   *
   * @param name The name for finding
   * @returns The access token service or `null` when not found
   */
  find(name: string): AccessTokenService | null {
    for (const accessTokenService of this.accessTokenServices) {
      if (accessTokenService.name === name) {
        return accessTokenService;
      }
    }

    return null;
  }
}
