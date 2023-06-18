# NgxOauth2AccessToken

This library is for simply getting access tokens from [OAuth 2.0](https://oauth.net/2/) in the standard scenario.

![GitHub package.json version (subfolder of monorepo)](https://img.shields.io/github/package-json/v/mrpachara/ngx?filename=projects%2Fmrpachara%2Fngx-oauth2-access-token%2Fpackage.json)
![GitHub](https://img.shields.io/github/license/mrpachara/ngx)

## Installation

npm

```bash
$ npm install @mrpachara/ngx-oauth2-access-token
```

## Configuration Example

File: `src/app/app.config.ts`

```typescript
// ... import other modules

import {
  AccessTokenConfig,
  AccessTokenResponse,
  AuthorizationCodeConfig,
  AuthorizationCodeService,
  IdTokenService,
  Oauth2ClientConfig,
  Scopes,
  StateActionInfo,
  configIdToken,
  provideAccessToken,
  provideAuthorizationCode,
  provideKeyValuePairsStorage,
  provideOauth2Client,
  provideStateAction,
  randomString,
  withAccessTokenResponseExtractor,
  withRenewAccessTokenSource,
  withStateActionErrorHandler,
  withStateActionHandler,
} from '@mrpachara/ngx-oauth2-access-token';

import { routes } from './app.routes';

const clientConfig: Oauth2ClientConfig = {
  name: 'google',
  clientId: clientId,
  clientSecret: clientSecret,
  accessTokenUrl: 'https://oauth2.googleapis.com/token',
};

const authorizationCodeConfig: AuthorizationCodeConfig = {
  name: 'google',
  authorizationCodeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  redirectUri: 'http://localhost:4200/google/authorization',
  pkce: 'S256',
  // NOTE: For getting refresh token from Google
  additionalParams: {
    prompt: 'consent',
    access_type: 'offline',
  },
};

const accessTokenConfig: AccessTokenConfig = {
  name: 'google',
};

// NOTE: configIdToken() returns the full configuration
//       from the given optional configuration.
const idTokenFullConfig = configIdToken({
  providedInAccessToken: false,
});

const jwkConfig: JwkConfig = {
  name: 'google',
  issuer: 'https://accounts.google.com',
  jwkSetUrl: 'https://www.googleapis.com/oauth2/v3/certs',
};

type BroadcastData =
  | {
      type: 'success';
      data: AccessTokenResponse;
    }
  | {
      type: 'error';
      error: unknown;
    };

type BroadcastActionInfo = StateActionInfo<
  'broadcast',
  {
    channel: string;
  }
>;

export const appConfig: ApplicationConfig = {
  providers: [
    // NOTE: withComponentInputBinding() will atomatically bind
    //       query strings to component inputs.
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),

    // NOTE: The ngx-oauth2-access-token provide functions
    provideKeyValuePairsStorage('ngx-oat', 1), // This is needed now.
    provideOauth2Client(clientConfig),
    provideAuthorizationCode(authorizationCodeConfig),
    provideAccessToken(
      accessTokenConfig,
      // NOTE: The process for getting the new access token
      withRenewAccessTokenSource(() => {
        const authorizationCodeService = inject(AuthorizationCodeService);

        return new Observable<AccessTokenResponse>((subscriber) => {
          const scopeText = prompt('Input scope');

          if (scopeText === null) {
            // NOTE: It's safe to throw here because it's out of
            //       asynchronous process. In asychronous process,
            //       we have to use reject();
            throw new Error('Authorization was canceled.');
          }

          const scopes = scopeText.split(/\s+/) as Scopes;

          const channelName = randomString(8);
          const channel = new BroadcastChannel(channelName);

          channel.addEventListener('message', (ev) => {
            const data = ev.data as BroadcastData;

            if (data.type === 'success') {
              subscriber.next(data.data);
            } else {
              subscriber.error(data.error);
            }

            subscriber.complete();
          });

          (async () => {
            const url =
              await authorizationCodeService.fetchAuthorizationCodeUrl(scopes, {
                // NOTE: The name of action will be performed in the callback URL.
                //       And the data using in the callback URL.
                action: {
                  name: 'broadcast',
                  data: {
                    channel: channelName,
                  },
                } as BroadcastActionInfo,
              });

            open(url, '_blank');
          })();

          return () => {
            channel.close();
          };
        });
      }),

      // NOTE: The individual extractors can be set here if needed.
      // withAccessTokenResponseExtractor(IdTokenService, idTokenFullConfig),
    ),

    // NOTE: Add additional extractors.
    provideAccessTokenResponseExtractors(
      // NOTE: Add ID token extractor for getting information
      //       from access token response.
      withAccessTokenResponseExtractor(IdTokenService, idTokenFullConfig),
    ),

    // NOTE: The process in callback URL.
    provideStateAction(
      // NOTE: Use StateActionInfo to determine the types of handler
      withStateActionHandler<BroadcastActionInfo>('broadcast', () => {
        return async (accessTokenResponse, stateData) => {
          const data = stateData.action.data;

          const channelName = data.channel;

          const channel = new BroadcastChannel(`${channelName}`);
          channel.postMessage({
            type: 'success',
            data: accessTokenResponse,
          } as BroadcastData);

          channel.close();
          close();

          // NOTE: If window cannot be closed, we provide success message.
          return 'Access token has been set by another process.';
        };
      }),

      // NOTE: When the server return error
      withStateActionErrorHandler(() => {
        return async (err, stateData) => {
          const errData: BroadcastData = {
            type: 'error',
            error: err,
          };

          if (stateData?.action) {
            const broadcastActionInfo = stateData.action as BroadcastActionInfo;

            const data = broadcastActionInfo.data;
            const channel = new BroadcastChannel(`${data['channel']}`);

            channel.postMessage(errData);
            channel.close();
            // close(); // close windows if needed
          }
        };
      }),
    ),
  ],
};
```

FILE: `src/app/app.routes.ts`

```typescript
import { Routes } from '@angular/router';

import { AuthorizationCodeCallbackComponent } from '@mrpachara/ngx-oauth2-access-token';

import { HomeComponent } from './core/home/home.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // NOTE: HomeComponent should call AccessTokenService.fetchToken()
  //       or AccessTokenService.extract(idTokenService).
  { path: 'home', component: HomeComponent },

  {
    path: 'google/authorization',
    component: AuthorizationCodeCallbackComponent,
  },
];
```

## JWK Configuration Example

File: `src/app/app.config.ts`

```typescript
const jwkConfig: JwkConfig = {
  name: 'google',
  issuer: 'https://accounts.google.com',
  jwkSetUrl: 'https://www.googleapis.com/oauth2/v3/certs',
};

// In providers configuration

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    provideJwk(jwkConfig),
    // ... other providers
  ],
};
```
