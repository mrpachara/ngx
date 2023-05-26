import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AccessToken,
  AccessTokenResponseListener,
  StoredAccessToken,
} from '../types';

export const RENEW_ACCESS_TOKEN_SOURCE = new InjectionToken<
  Observable<AccessToken>
>('renew-access-token-source');

export const ACCESS_TOKEN_RESPONSE_LISTENERS = new InjectionToken<
  AccessTokenResponseListener<StoredAccessToken>[]
>('access-token-response-listeners', {
  providedIn: 'root',
  factory: () => [],
});
