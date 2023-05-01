import { InjectionToken } from '@angular/core';
import {
  AccessTokenServiceConfig,
  AuthorizationCodeServiceConfig,
  Oauth2ClientConfig,
} from '../types';

export const OAUTH2_CLIENT_CONFIG = new InjectionToken<Oauth2ClientConfig>(
  'oauth2-client-config',
);

export const ACCESS_TOKEN_SERVICE_CONFIG =
  new InjectionToken<AccessTokenServiceConfig>('access-token-service-config');

export const AUTHORIZATION_CODE_SERVICE_CONFIG =
  new InjectionToken<AuthorizationCodeServiceConfig>(
    'authorization-code-config',
  );
