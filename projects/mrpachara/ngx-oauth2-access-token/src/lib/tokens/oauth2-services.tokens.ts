import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { AccessToken, StoredAccessToken, TokenExtractor } from '../types';

export const RENEW_ACCESS_TOKEN_SOURCE = new InjectionToken<
  Observable<AccessToken>
>('renew-access-token-source');

export const ACCESS_TOKEN_EXTRACTOR = new InjectionToken<
  TokenExtractor<StoredAccessToken, unknown>[]
>('access-token-extractor', {
  providedIn: 'root',
  factory: () => [],
});
