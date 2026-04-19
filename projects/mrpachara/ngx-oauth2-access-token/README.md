# NgxOauth2AccessToken

This library is for simply getting access tokens from [OAuth 2.0](https://oauth.net/2/) in the standard scenario.

![GitHub package.json version (subfolder of monorepo)](https://img.shields.io/github/package-json/v/mrpachara/ngx?filename=projects%2Fmrpachara%2Fngx-oauth2-access-token%2Fpackage.json)
![GitHub](https://img.shields.io/github/license/mrpachara/ngx)

## Installation

npm

```bash
$ npm install @mrpachara/ngx-oauth2-access-token
```

## Configuration Examples

FILE: `src/app/app.routes.ts`

```typescript
import  { Routes } from '@angular/router';
import  { AuthorizationCodeCallbackComponent } from '@mrpachara/ngx-oauth2-access-token';
import  { HomeComponent } from './core/home/home.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  { path: 'home', component: HomeComponent },

  {
    path: 'google/authorization',
    component: AuthorizationCodeCallbackComponent,
  },
];
```

File: `src/app/app.config.ts`

```typescript
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideRouter } from '@angular/router';
import {
  AdditionalParams,
  createIdKey,
  provideAccessToken,
  Scopes,
  withAuthorizationCode,
} from '@mrpachara/ngx-oauth2-access-token';
import {
  provideIdTokenExtractor,
  withClaimmsTransformation,
  withJwkVerification,
} from '@mrpachara/ngx-oauth2-access-token/extractors';
import { routes } from '../app.routes';

export const googleOauth = createIdKey('google');

export const scopes: Scopes = ['profile', 'email', 'openid'];

export const params: AdditionalParams = {
  prompt: 'consent',
  access_type: 'offline',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideRouter(routes, withComponentInputBinding()),

    // NOTE: The ngx-oauth2-access-token provide functions
    provideAccessToken(
      {
        id: googleOauth,
        clientId: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
        clientSecret: 'YOUR_CLIENT_SECRET',
        accessTokenUrl: 'https://oauth2.googleapis.com/token',
      },
      withAuthorizationCode({
        authorizationCodeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        redirectUri: `${window.location.origin}/google/authorization`,
        pkce: 'S256',
      }),
    ),

    provideIdTokenExtractor(
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
```

### With JWK verification Configuration Example

File: `src/app/app.config.ts`

```typescript
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideRouter } from '@angular/router';
import {
  AdditionalParams,
  createIdKey,
  provideAccessToken,
  Scopes,
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
import { routes } from '../app.routes';

export const googleOauth = createIdKey('google');

export const scopes: Scopes = ['profile', 'email', 'openid'];

export const params: AdditionalParams = {
  prompt: 'consent',
  access_type: 'offline',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideRouter(routes, withComponentInputBinding()),

    // NOTE: The ngx-oauth2-access-token provide functions
    provideAccessToken(
      {
        id: googleOauth,
        clientId: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
        clientSecret: 'YOUR_CLIENT_SECRET',
        accessTokenUrl: 'https://oauth2.googleapis.com/token',
      },
      withAuthorizationCode({
        authorizationCodeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        redirectUri: `${window.location.origin}/google/authorization`,
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

```
