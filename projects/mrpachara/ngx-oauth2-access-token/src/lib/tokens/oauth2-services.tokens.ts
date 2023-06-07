import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { AccessTokenResponse } from '../types';
import { AccessTokenService } from '../access-token.service';
import { AuthorizationCodeService } from '../authorization-code.service';

export const ACCESS_TOKEN_SERVICES = new InjectionToken<AccessTokenService[]>(
  'access-token-services',
  {
    providedIn: 'root',
    factory: () => [],
  },
);

export const AUTHORIZATION_CODE_SERVICES = new InjectionToken<
  AuthorizationCodeService[]
>('authorization-code-services', {
  providedIn: 'root',
  factory: () => [],
});

export const RENEW_ACCESS_TOKEN_SOURCE = new InjectionToken<
  Observable<AccessTokenResponse>
>('renew-access-token-source');
