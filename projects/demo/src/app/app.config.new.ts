import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  ApplicationConfig,
  provideExperimentalZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import {
  provideAccessToken,
  provideAuthorizationCode,
  provideJwkDispatcher,
} from '@mrpachara/ngx-oauth2-access-token';
import { verifyEddsa } from '@mrpachara/ngx-oauth2-access-token/jwt-verifiers';
import { routes } from './app.routes';

export const myOauth = Symbol('my');

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    // NOTE: withComponentInputBinding() will atomatically bind
    //       query strings to component inputs.
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),

    // NOTE: The ngx-oauth2-access-token provide functions
    provideAccessToken(myOauth, {
      clientId: 'web-app',
      accessTokenUrl: 'http://localhost:8080/v2/token',
    }),

    provideAuthorizationCode(myOauth, {
      authorizationCodeUrl: 'http://localhost:8080/account/authorize/consent',
      redirectUri: 'http://localhost:4200/google/authorization',
      pkce: 'S256',
    }),

    provideJwkDispatcher(
      {
        'http://localhost:8080': {
          jwkSetUrl: 'http://localhost:8080/.well-known/jwk-set.json',
        },
      },
      [verifyEddsa],
    ),
  ],
};
