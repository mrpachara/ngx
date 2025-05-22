import { HttpContextToken, HttpErrorResponse } from '@angular/common/http';
import { InjectionToken } from '@angular/core';
import {
  Oauth2ClientConfigWithId,
  Oauth2ClientErrorTransformer,
} from '../types';

/** The injection token for Oauth2 client config */
export const OAUTH2_CLIENT_CONFIG =
  new InjectionToken<Oauth2ClientConfigWithId>('oath2-client-config');

/**
 * The token for `HttpClient` indicates that **DO NOT** assign access token for
 * this request. It is useful for HTTP request interceptors.
 */
export const SKIP_ASSIGNING_ACCESS_TOKEN = new HttpContextToken(() => false);

/** The injection token for OAuth 2.0 error response transformer function */
export const OAUTH2_CLIENT_ERROR_TRANSFORMER =
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
