import { InjectionToken, inject } from '@angular/core';

import { configRefreshToken } from '../functions';
import {
  AccessTokenService,
  AuthorizationCodeService,
  RefreshTokenService,
} from '../services';
import { AccessTokenResponseExtractorInfo } from '../types';

/** The injection token for access token services */
export const ACCESS_TOKEN_SERVICES = new InjectionToken<AccessTokenService[]>(
  'access-token-services',
  {
    providedIn: 'root',
    factory: () => [],
  },
);

/** The injection token for default access token response extractor informations */
export const PREREQUIRED_ACCESS_TOKEN_RESPONSE_EXTRACTOR_INFOS =
  new InjectionToken<AccessTokenResponseExtractorInfo[]>(
    'prerequired-access-token-response-extractor-infos',
    {
      providedIn: 'root',
      factory: () => [
        [inject(RefreshTokenService), configRefreshToken({})] as const,
      ],
    },
  );

/** The injection token for scoped access token response extractor informations */
export const ACCESS_TOKEN_RESPONSE_EXTRACTOR_INFOS = new InjectionToken<
  AccessTokenResponseExtractorInfo[]
>('access-token-response-extractor-infos', {
  providedIn: 'root',
  factory: () => [],
});

/** The injection token for authorization code services */
export const AUTHORIZATION_CODE_SERVICES = new InjectionToken<
  AuthorizationCodeService[]
>('authorization-code-services', {
  providedIn: 'root',
  factory: () => [],
});
