import { InjectionToken } from '@angular/core';
import {
  AccessTokenFullConfig,
  AuthorizationCodeFullConfig,
  IdTokenFullConfig,
  Oauth2ClientFullConfig,
} from '../types';

export const OAUTH2_CLIENT_FULL_CONFIG =
  new InjectionToken<Oauth2ClientFullConfig>('oauth2-client-full-config');

export const ACCESS_TOKEN_FULL_CONFIG =
  new InjectionToken<AccessTokenFullConfig>('access-token-full-config');

export const AUTHORIZATION_CODE_FULL_CONFIG =
  new InjectionToken<AuthorizationCodeFullConfig>(
    'authorization-code-full-config',
  );

export const ID_TOKEN_FULL_CONFIG = new InjectionToken<IdTokenFullConfig>(
  'id-token-full-config',
);
