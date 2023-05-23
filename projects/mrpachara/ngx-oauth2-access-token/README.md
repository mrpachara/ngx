# NgxOauth2AccessToken

![GitHub package.json version (subfolder of monorepo)](https://img.shields.io/github/package-json/v/mrpachara/ngx?filename=projects%2Fmrpachara%2Fngx-oauth2-access-token%2Fpackage.json)
![GitHub](https://img.shields.io/github/license/mrpachara/ngx)

This library is for simply getting access tokens from [OAuth 2.0](https://oauth.net/2/) in the standard scenario.

## Installation

npm

```bash
$ npm install @mrpachara/ngx-oauth2-access-token
```

yarn

```bash
$ yarn add @mrpachara/ngx-oauth2-access-token
```

## Configuration Example

File: `src/app/app.config.ts`

```typescript
// ... import other modules

import {
  AccessToken,
  AccessTokenConfig,
  AuthorizationCodeConfig,
  AuthorizationCodeService,
  Oauth2ClientConfig,
  Scopes,
  parseStateAction,
  provideAccessToken,
  provideAuthorizationCode,
  provideOauth2Client,
  provideStateAction,
  randomString,
  stringifyStateAction,
  withErrorHandler,
  withRenewAccessTokenSource,
} from '@mrpachara/ngx-oauth2-access-token';

import { routes } from './app.routes';

const clientConfig: Oauth2ClientConfig = {
  name: 'google',
  debug: true,
  clientId: 'CLIENT_ID',
  clientSecret: 'CLIENT_SECRET',
  accessTokenUrl: 'https://oauth2.googleapis.com/token',
};

const authorizationCodeConfig: AuthorizationCodeConfig = {
  name: 'google',
  debug: true,
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
  debug: true,
};

type BroadcastData =
  | {
      type: 'success';
      data: AccessToken;
    }
  | {
      type: 'error';
      error: unknown;
    };

export const appConfig: ApplicationConfig = {
  providers: [
    // NOTE: withComponentInputBinding() will atomatically bind
    //       query strings to component inputs.
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),

    // NOTE: The ngx-oauth2-access-token provide functions
    provideOauth2Client(clientConfig),
    provideAuthorizationCode(authorizationCodeConfig),
    provideAccessToken(
      accessTokenConfig,
      // NOTE: The process for getting the new access token
      withRenewAccessTokenSource(() => {
        const authorizationCodeService = inject(AuthorizationCodeService);

        return defer(
          () =>
            new Promise<AccessToken>((resolve, reject) => {
              const scopeText = prompt('Input scope');

              if (scopeText === null) {
                throw new Error('The authorization process is canceled.');
              }

              const scopes = scopeText.split(/\s+/) as Scopes;

              const channelName = randomString(8);
              const channel = new BroadcastChannel(channelName);

              channel.addEventListener('message', (ev) => {
                const data = ev.data as BroadcastData;

                if (data.type === 'success') {
                  resolve(data.data);
                } else {
                  reject(data.error);
                }

                channel.close();
              });

              (async () => {
                const url = await authorizationCodeService.fetchAuthorizationCodeUrl(scopes, {
                  action: stringifyStateAction({
                    // NOTE: The name of action will be performed in the callback URL.
                    //       And the data using in the callback URL.
                    action: 'broadcast',
                    data: {
                      channel: channelName,
                    },
                  }),
                });
                open(url, '_blank');
              })();
            }),
        );
      }),
    ),

    // NOTE: The process in callback URL.
    provideStateAction(
      () => {
        return {
          // NOTE: The name of action
          broadcast: async (accessToken, data) => {
            const channelName = data['channel'];

            if (!channelName) {
              throw new Error('Broadcast channel is not found.');
            }

            const channel = new BroadcastChannel(`${channelName}`);

            channel.postMessage({
              type: 'success',
              data: accessToken,
            } as BroadcastData);

            channel.close();
            close();

            // NOTE: If window cannot be closed
            return 'Access token has been set by another process.';
          },
        };
      },

      // NOTE: When the server return error
      withErrorHandler(() => {
        return (err, stateData) => {
          const errData: BroadcastData = {
            type: 'error',
            error: err,
          };

          if (stateData?.action) {
            const { data } = parseStateAction(stateData.action);

            if (data['channel']) {
              const channel = new BroadcastChannel(`${data['channel']}`);

              channel.postMessage(errData);
              close();
            }
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

import { AutorizationCodeCallbackComponent } from '@mrpachara/ngx-oauth2-access-token';

import { HomeComponent } from './core/home/home.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  // NOTE: HomeComponent should call AccessTokenService.fetchAccessToken()
  { path: 'home', component: HomeComponent },
  {
    path: 'google/authorization',
    component: AutorizationCodeCallbackComponent,
  },
];
```
