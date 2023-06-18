import { InjectionToken } from '@angular/core';
import { HttpContextToken, HttpErrorResponse } from '@angular/common/http';

import { Oauth2Client } from '../services';
import { Oauth2ClientErrorTransformer } from '../types';

/**
 * The token for `HttpClient` indicates that **DO NOT** assign access token for
 * this request. It is useful for HTTP request interceptors.
 */
export const SKIP_ASSIGNING_ACCESS_TOKEN = new HttpContextToken(() => false);

/** The injection token for OAuth 2.0 clients */
export const OATUTH2_CLIENTS = new InjectionToken<Oauth2Client[]>(
  'oauth2-clients',
  {
    providedIn: 'root',
    factory: () => [],
  },
);

/** The injection token for OAuth 2.0 error response transformer function */
export const DEFAULT_OAUTH2_CLIENT_ERROR_TRANSFORMER =
  new InjectionToken<Oauth2ClientErrorTransformer>(
    'default-oauth2-client-error-transformer',
    {
      providedIn: 'root',
      factory() {
        return (err: HttpErrorResponse) => {
          return {
            error: err.error['error'] ?? err.name,
            error_description: err.error['error_description'] ?? err.message,
          };
        };
      },
    },
  );
