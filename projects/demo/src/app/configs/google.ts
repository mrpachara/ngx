import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import {
  AdditionalParams,
  Scopes,
  createIdKey,
  provideAccessToken,
  withAuthorizationCode,
} from '@mrpachara/ngx-oauth2-access-token';
import {
  provideIdTokenExtractor,
  withClaimmsTransformation,
  withJwkVerification,
} from '@mrpachara/ngx-oauth2-access-token/extractors';
import { provideJwkDispatcher } from '@mrpachara/ngx-oauth2-access-token/jwk';
import {
  verifyEcdsa,
  verifyEddsa,
  verifyRsassa,
} from '@mrpachara/ngx-oauth2-access-token/jwk/verifiers';
import { clientId, clientSecret } from '../../secrets/oauth-client';
import { routes } from '../app.routes';

export const demoOauth = createIdKey('google');

export const scopes: Scopes = ['profile', 'email', 'openid'];

export const params: AdditionalParams = {
  prompt: 'consent',
  access_type: 'offline',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    // NOTE: withComponentInputBinding() will atomatically bind
    //       query strings to component inputs.
    provideRouter(routes, withComponentInputBinding()),

    provideHttpClient(withFetch()),

    // NOTE: The ngx-oauth2-access-token provide functions
    provideAccessToken(
      {
        id: demoOauth,
        clientId: clientId,
        clientSecret: clientSecret,
        accessTokenUrl: 'https://oauth2.googleapis.com/token',
      },
      withAuthorizationCode({
        authorizationCodeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        redirectUri: 'http://localhost:4200/google/authorization',
        pkce: 'S256',
      }),
    ),

    provideJwkDispatcher(
      {
        'https://accounts.google.com': {
          jwkSetUrl: 'https://www.googleapis.com/oauth2/v3/certs',
        },
      },
      [verifyRsassa, verifyEcdsa, verifyEddsa],
    ),

    provideIdTokenExtractor(
      // NOTE: Use verification from JWK Dispatcher
      withJwkVerification(),

      // NOTE: Google responds only changed claims, so merge them.
      withClaimmsTransformation(() => (oldClaims, newClaims) => {
        if (oldClaims.sub === newClaims.sub) {
          return {
            ...oldClaims,
            ...newClaims,
          };
        } else {
          return newClaims;
        }
      }),
    ),
  ],
};
