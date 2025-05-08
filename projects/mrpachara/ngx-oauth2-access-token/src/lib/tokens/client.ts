import { HttpContextToken, HttpErrorResponse } from '@angular/common/http';
import { inject, InjectionToken } from '@angular/core';

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

/**
 * Inject Oauth2Client from the given name.
 *
 * @param name Oauth2Client name.
 * @returns Oauth2Client Oauth2Client from the given name.
 * @throws If is not found.
 * @publicApi
 */
export function injectOauth2Client(name: string): Oauth2Client {
  const clients = inject(OATUTH2_CLIENTS);

  const client = clients.find((client) => client.name === name);

  if (!client) {
    throw new Error(`Oauth2 client '${name}' is not found.`);
  }

  return client;
}

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
