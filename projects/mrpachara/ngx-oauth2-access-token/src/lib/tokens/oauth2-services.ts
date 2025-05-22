import { InjectionToken, inject } from '@angular/core';

import { configRefreshToken } from '../helpers';
import { RefreshTokenService } from '../services';
import { AccessTokenResponseExtractorInfo } from '../types';

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
