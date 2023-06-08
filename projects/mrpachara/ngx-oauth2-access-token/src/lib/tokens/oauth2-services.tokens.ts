import { InjectionToken, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AccessTokenService,
  AuthorizationCodeService,
  RefreshTokenService,
} from '../services';
import {
  AccessTokenResponse,
  AccessTokenResponseExtractorInfo,
} from '../types';
import { configRefreshToken } from '../functions';

export const ACCESS_TOKEN_SERVICES = new InjectionToken<AccessTokenService[]>(
  'access-token-services',
  {
    providedIn: 'root',
    factory: () => [],
  },
);

export const RENEW_ACCESS_TOKEN_SOURCE = new InjectionToken<
  Observable<AccessTokenResponse>
>('renew-access-token-source');

export const DEFAULT_ACCESS_TOKEN_RESPONSE_EXTRACTOR_INFOS = new InjectionToken<
  AccessTokenResponseExtractorInfo[]
>('default-access-token-response-extractor-infos', {
  providedIn: 'root',
  factory: () => [
    [inject(RefreshTokenService), configRefreshToken({})] as const,
  ],
});

export const ACCESS_TOKEN_RESPONSE_EXTRACTOR_INFOS = new InjectionToken<
  AccessTokenResponseExtractorInfo[]
>('access-token-response-extractor-infos', {
  providedIn: 'root',
  factory: () => [],
});

export const AUTHORIZATION_CODE_SERVICES = new InjectionToken<
  AuthorizationCodeService[]
>('authorization-code-services', {
  providedIn: 'root',
  factory: () => [],
});
