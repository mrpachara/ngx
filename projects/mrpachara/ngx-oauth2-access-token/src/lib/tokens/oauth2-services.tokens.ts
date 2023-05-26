import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AccessToken,
  StoredAccessToken,
  TokenResponseListener,
} from '../types';

export const RENEW_ACCESS_TOKEN_SOURCE = new InjectionToken<
  Observable<AccessToken>
>('renew-access-token-source');

export const TOKEN_RESPONSE_LISTENERS = new InjectionToken<
  TokenResponseListener<StoredAccessToken>[]
>('token-response-listeners', {
  providedIn: 'root',
  factory: () => [],
});
