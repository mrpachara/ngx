import { Injectable, inject } from '@angular/core';
import { AUTHORIZATION_CODE_SERVICES } from '../tokens';
import { AuthorizationCodeService } from '../services';

@Injectable({
  providedIn: 'root',
})
export class AuthorizationCodeServiceResolver {
  private readonly authorizationCodeServices = inject(
    AUTHORIZATION_CODE_SERVICES,
  );

  find(name: string): AuthorizationCodeService | null {
    for (const authorizationCodeService of this.authorizationCodeServices) {
      if (authorizationCodeService.name === name) {
        return authorizationCodeService;
      }
    }

    return null;
  }
}
