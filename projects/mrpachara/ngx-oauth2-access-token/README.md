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
import  {
  AuthorizationCodeCallbackComponent,
  provideAuthorizationCodeCallbackData,
} from '@mrpachara/ngx-oauth2-access-token';
import  { HomeComponent } from './core/home/home.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  { path: 'home', component: HomeComponent },

  {
    path: 'google/authorization',
    providers: [
      provideAuthorizationCodeCallbackData<{ intendedUrl: string }>(() => ({
        // id: googleOauth // for specifying AccessTokenService
        actionFactory: () => {
          const router = inject(Router);

          // NOTE: intendedUrl is a state data.
          return ({ intendedUrl }) => {
            router.navigateByUrl(intendedUrl, { replaceUrl: true });
          };
        },
      })),
    ],
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
  createIdKey,
  provideAccessToken,
  withAuthorizationCode,
} from '@mrpachara/ngx-oauth2-access-token';
import {
  provideIdTokenExtractor,
  withClaimmsTransformation,
  withJwkVerification,
} from '@mrpachara/ngx-oauth2-access-token/extractors';
import { routes } from '../app.routes';

export const googleOauth = createIdKey('google');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideRouter(routes, withComponentInputBinding()),

    // NOTE: The ngx-oauth2-access-token provide functions
    //       Can provide multiple AccessTokenServices with the difference ids.
    provideAccessToken(
      {
        id: googleOauth,
        clientId: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
        clientSecret: 'YOUR_CLIENT_SECRET', // if needed
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
import { routes } from '../app.routes';

export const googleOauth = createIdKey('google');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideRouter(routes, withComponentInputBinding()),

    // NOTE: The ngx-oauth2-access-token provide functions.
    provideAccessToken(
      {
        id: googleOauth,
        clientId: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
        clientSecret: 'YOUR_CLIENT_SECRET', // if needed
        accessTokenUrl: 'https://oauth2.googleapis.com/token',
      },
      withAuthorizationCode({
        authorizationCodeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        redirectUri: `${window.location.origin}/google/authorization`,
        pkce: 'S256',
      }),
    ),

    provideJwkDispatcher(
      // The keys are issuers.
      {
        'https://accounts.google.com': {
          jwkSetUrl: 'https://www.googleapis.com/oauth2/v3/certs',
        },
      },

      // A list of available verifiers
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

## Using Services

### `AccessTokenService`

#### Injecting the last provided `AccessTokenService`

```typescript
import { inject } from '@angular/core';
import { AccessTokenService } from '@mrpachara/ngx-oauth2-access-token';

class YourClass {
  private readonly accessTokenService = inject(AccessTokenService);
}

```

#### Injecting a specific `AccessTokenService`

```typescript
import { injectAccessTokenService } from '@mrpachara/ngx-oauth2-access-token';
import { googleOauth } from '../app.config';

class YourClass {
  private readonly accessTokenService = injectAccessTokenService(googleOauth);
}

```

#### Using `AccessTokenService`

```typescript
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { defer, switchMap, throwError } from 'rxjs';
import { AccessTokenService } from '@mrpachara/ngx-oauth2-access-token';
import { Data } from '../types';

class YourClass {
  private readonly accessTokenService = inject(AccessTokenService);

  private readonly http = inject(HttpClient);

  /** Create observable data from resource server */
  protected readonly data$ = defer(() => this.accessTokenService.loadAccessTokenInfo())
    .pipe(
      switchMap((tokenInfo) =>
        tokenInfo === null
          ? throwError(() => 'access token not found')
          : this.http.get<Data>('https://api.example.net', {
              headers: {
                Authorization: `${tokenInfo.type} ${tokenInfo.token}`,
              },
            }),
      ),
    );

  /** Create a access token response resource, Angular Resource API. */
  protected readonly accessTokenResource = this.accessTokenService.responseResource();

  /** Fetch access token. */
  protected async fetchByRefreshToken(): Promise<void> {
    await this.accessTokenService.fetch('refresh_token');
  }

  /** Clear all tokens */
  protected async clearAccessToken(): Promise<void> {
    await this.accessTokenService.clearTokens();
  }
}

```

### `AuthorizationCodeService`

#### Injecting the last provided `AuthorizationCodeService`

```typescript
import { inject } from '@angular/core';
import { AuthorizationCodeService } from '@mrpachara/ngx-oauth2-access-token';

class YourClass {
  private readonly authorizationCodeService = inject(AuthorizationCodeService);
}

```

#### Injecting a specific `AuthorizationCodeService`

```typescript
import { injectAuthorizationCodeService } from '@mrpachara/ngx-oauth2-access-token';
import { googleOauth } from '../app.config';

class YourClass {
  private readonly authorizationCodeService = injectAuthorizationCodeService(googleOauth);
}

```

#### Using `AuthorizationCodeService`

```typescript
import { inject } from '@angular/core';
import { injectAuthorizationCodeService } from '@mrpachara/ngx-oauth2-access-token';

class YourClass {
  private readonly authorizationCodeService = inject(AuthorizationCodeService);

  private readonly router = inject(Router);

  /** Forward to authorization server */
  protected async authorize(): Promise<void> {
    const url = await this.authorizationCodeService.generateUrl(
      // scopes
      ['profile', 'email', 'openid'],

      // stateData
      {
        intendedUrl: this.router.url,
      },

      // additionalParams
      {
        prompt: 'consent',
        access_type: 'offline',
      },
    );

    location.href = url.toString();
  }
}

```

### `IdTokenExtractor`

```typescript
import { inject } from '@angular/core';
import { IdTokenExtractor } from '@mrpachara/ngx-oauth2-access-token/extractors';

class YourClass {
  private readonly idTokenExtractor = inject(IdTokenExtractor);

  /**
   * Create a ID token claims resource, Angular Resource API.
   * Use claimsResource(googleOauth) for specifying AccessTokenService.
   */
  protected readonly idTokenClaimsResource = this.idTokenExtractor.claimsResource();
}

```

## Using `HttpClient` interceptor

### Configuration

File: `src/app/app.config.ts`

```typescript
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { provideRouter } from '@angular/router';
import {
  createAssignAccessTokenInterceptor
  createIdKey,
  provideAccessToken,
  withAuthorizationCode,
} from '@mrpachara/ngx-oauth2-access-token';
import {
  provideIdTokenExtractor,
  withClaimmsTransformation,
  withJwkVerification,
} from '@mrpachara/ngx-oauth2-access-token/extractors';
import { routes } from '../app.routes';

export const googleOauth = createIdKey('google');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideRouter(routes, withComponentInputBinding()),

    // NOTE: The ngx-oauth2-access-token provide functions
    provideAccessToken(
      {
        id: googleOauth,
        clientId: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
        clientSecret: 'YOUR_CLIENT_SECRET', // if needed
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

    provideHttpClient(
      // NOTE: create intercaptor
      withInterceptors([createAssignAccessTokenInterceptor()]),
    ),
  ],
};
```

### Assigning access token to `HttpClient` request

```typescript
import { HttpContext, httpResource } from '@angular/common/http';
import { WITH_ACCESS_TOKEN } from '@mrpachara/ngx-oauth2-access-token';
import { Data } from '../types';

class YourClass {
  /** Create data resource from `httpResource()` */
  protected readonly dataResource = httpResource<Data>(() => ({
    url: 'https://api.example.net',

    // NOTE: Can change true to googleOauth for specifying AccessTokenService.
    context: new HttpContext().set(WITH_ACCESS_TOKEN, true),
  }));
}

```
