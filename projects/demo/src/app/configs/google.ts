import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  ApplicationConfig,
  provideExperimentalZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import {
  AdditionalParams,
  provideAccessToken,
  provideAuthorizationCode,
  provideJwkDispatcher,
  Scopes,
} from '@mrpachara/ngx-oauth2-access-token';
import {
  verifyEcdsa,
  verifyEddsa,
  verifyRsassa,
} from '@mrpachara/ngx-oauth2-access-token/jwt-verifiers';
import { clientId, clientSecret } from '../../secrets/oauth-client';
import { routes } from '../app.routes';

export const demoOauth = Symbol('google');

export const scopes: Scopes = ['profile', 'email'];

export const params: AdditionalParams = {
  prompt: 'consent',
  access_type: 'offline',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    // NOTE: withComponentInputBinding() will atomatically bind
    //       query strings to component inputs.
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),

    // NOTE: The ngx-oauth2-access-token provide functions
    provideAccessToken(demoOauth, {
      clientId: clientId,
      clientSecret: clientSecret,
      accessTokenUrl: 'https://oauth2.googleapis.com/token',
    }),

    provideAuthorizationCode(demoOauth, {
      authorizationCodeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      redirectUri: 'http://localhost:4200/google/authorization',
      pkce: 'S256',
    }),

    provideJwkDispatcher(
      {
        'https://accounts.google.com': {
          jwkSetUrl: 'https://www.googleapis.com/oauth2/v3/certs',
        },
      },
      [verifyRsassa, verifyEcdsa, verifyEddsa],
    ),
  ],
};
