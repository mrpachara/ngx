import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { AccessToken } from '../types';

export const RENEW_ACCESS_TOKEN_SOURCE = new InjectionToken<
  Observable<AccessToken>
>('renew-access-token-source');
