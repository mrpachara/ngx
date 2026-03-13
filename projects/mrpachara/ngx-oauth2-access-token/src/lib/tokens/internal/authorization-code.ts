import { InjectionToken } from '@angular/core';
import { AuthorizationCodeService } from '../../services';
import { IdKey } from '../common';

/** The injection token for authorization code tokens */
export const AUTHORIZATION_CODE_SERVICE_TOKENS = new InjectionToken<
  {
    readonly id: IdKey;
    readonly token: InjectionToken<AuthorizationCodeService>;
  }[]
>('authorization-code-tokens', {
  providedIn: 'root',
  factory: () => [],
});

/** The injection token for authorization code hierarchized tokens */
export const AUTHORIZATION_CODE_SERVICE_HIERARCHIZED_TOKENS =
  new InjectionToken<
    {
      readonly id: IdKey;
      readonly token: InjectionToken<AuthorizationCodeService>;
    }[]
  >('authorization-code-hierarachized-tokens', {
    providedIn: 'root',
    factory: () => [],
  });
