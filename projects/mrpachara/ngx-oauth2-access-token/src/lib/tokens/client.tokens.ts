import { InjectionToken } from '@angular/core';
import { HttpContextToken, HttpErrorResponse } from '@angular/common/http';

import { Oauth2Client } from '../services';
import { Oauth2ClientErrorTransformer } from '../types';

export const SKIP_ASSIGNING_ACCESS_TOKEN = new HttpContextToken(() => false);

export const OATUTH2_CLIENTS = new InjectionToken<Oauth2Client[]>(
  'oauth2-clients',
  {
    providedIn: 'root',
    factory: () => [],
  },
);

export const OAUTH2_CLIENT_ERROR_TRANSFORMER =
  new InjectionToken<Oauth2ClientErrorTransformer>(
    'oauth2-client-error-gransformer',
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
