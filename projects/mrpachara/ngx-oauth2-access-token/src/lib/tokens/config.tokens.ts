import { InjectionToken } from '@angular/core';
import {
  AccessTokenConfig,
  AuthorizationCodeConfig,
  Oauth2ClientConfig,
} from '../types';

export const OAUTH2_CLIENT_CONFIG = new InjectionToken<Oauth2ClientConfig>(
  'oauth2-client-config',
);

export const ACCESS_TOKEN_CONFIG = new InjectionToken<AccessTokenConfig>(
  'access-token-config',
);

export const AUTHORIZATION_CODE_CONFIG =
  new InjectionToken<AuthorizationCodeConfig>('authorization-code-config');
