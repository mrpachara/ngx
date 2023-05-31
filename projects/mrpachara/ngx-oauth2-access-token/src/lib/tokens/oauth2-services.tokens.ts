import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { AccessTokenResponse } from '../types';

export const RENEW_ACCESS_TOKEN_SOURCE = new InjectionToken<
  Observable<AccessTokenResponse>
>('renew-access-token-source');
