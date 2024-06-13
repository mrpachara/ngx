import { Injectable, inject } from '@angular/core';

import { AuthorizationCodeService } from '../services';
import { AUTHORIZATION_CODE_SERVICES } from '../tokens';

/** Authorization code service resolver */
@Injectable({
  providedIn: 'root',
})
export class AuthorizationCodeServiceResolver {
  private readonly authorizationCodeServices = inject(
    AUTHORIZATION_CODE_SERVICES,
  );

  /**
   * Find an authorization code service from the given `name`.
   *
   * @param name The name for finding
   * @returns The authorization code service or `null` when not found
   */
  find(name: string): AuthorizationCodeService | null {
    for (const authorizationCodeService of this.authorizationCodeServices) {
      if (authorizationCodeService.name === name) {
        return authorizationCodeService;
      }
    }

    return null;
  }
}
