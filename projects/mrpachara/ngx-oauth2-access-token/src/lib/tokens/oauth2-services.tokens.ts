import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { AccessTokenResponse, AccessTokenResponseListener } from '../types';

export const RENEW_ACCESS_TOKEN_SOURCE = new InjectionToken<
  Observable<AccessTokenResponse>
>('renew-access-token-source');

export const ACCESS_TOKEN_RESPONSE_LISTENERS = new InjectionToken<
  AccessTokenResponseListener<AccessTokenResponse>[]
>('access-token-response-listeners', {
  providedIn: 'root',
  factory: () => [],
});
