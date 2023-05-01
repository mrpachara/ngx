import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { AccessToken } from '../types';

export const EXTERNAL_SOURCE_ACCESS_TOKEN = new InjectionToken<
  Observable<AccessToken>
>('external-source-access-token');
