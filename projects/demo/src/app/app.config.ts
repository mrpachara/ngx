import { ApplicationConfig, inject } from '@angular/core';
import {
  Router,
  provideRouter,
  withComponentInputBinding,
} from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import {
  AccessToken,
  AccessTokenConfig,
  AccessTokenService,
  AuthorizationCodeConfig,
  AuthorizationCodeService,
  IdTokenConfig,
  Oauth2ClientConfig,
  Scopes,
  StateActionInfo,
  parseStateAction,
  provideAccessToken,
  provideAuthorizationCode,
  provideIdToken,
  provideOauth2Client,
  provideStateAction,
  randomString,
  stringifyStateAction,
  withErrorHandler,
  withRenewAccessTokenSource,
} from '@mrpachara/ngx-oauth2-access-token';

import { routes } from './app.routes';
import { defer } from 'rxjs';

const clientConfig: Oauth2ClientConfig = {
  name: 'google',
  debug: true,
  clientId:
    '209689905225-dj1bo29m0c7or5926cv4bb1nu5aru0cv.apps.googleusercontent.com',
  clientSecret: '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',
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

const idTokenConfig: IdTokenConfig = {
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
        const router = inject(Router);

        return defer(
          () =>
            new Promise<AccessToken>((resolve, reject) => {
              const scopeText = prompt('Input scope');

              if (scopeText === null) {
                throw new Error('Authorization is canceled.');
              }

              const scopes = scopeText.split(/\s+/) as Scopes;
              const isNewTab = confirm('Open in new tab');
              const useBroadcast =
                isNewTab &&
                typeof BroadcastChannel !== 'undefined' &&
                confirm('Use broadcast');

              const stateActionInfo: StateActionInfo = {
                action: 'unknown',
                data: {},
              };

              if (useBroadcast) {
                const channelName = randomString(8);
                const channel = new BroadcastChannel(channelName);

                channel.addEventListener('message', (ev) => {
                  const data = ev.data as BroadcastData;

                  if (data.type === 'success') {
                    resolve(data.data);
                    channel.postMessage(true);
                  } else {
                    reject(data.error);
                    channel.postMessage(false);
                  }

                  channel.close();
                });

                // NOTE: The name of action will be performed in the callback URL.
                //       And the data using in the callback URL.
                stateActionInfo.action = 'broadcast';
                stateActionInfo.data = {
                  channel: channelName,
                };
              } else {
                stateActionInfo.action = 'set';
              }

              if (isNewTab) {
                stateActionInfo.data['close'] = false;
              } else {
                stateActionInfo.data['redirectUrl'] = router.url;
              }

              (async () => {
                const url =
                  await authorizationCodeService.fetchAuthorizationCodeUrl(
                    scopes,
                    {
                      action: stringifyStateAction(stateActionInfo),
                    },
                  );
                if (isNewTab) {
                  open(url, '_blank');
                } else {
                  location.href = url.toString();
                }
              })();
            }),
        );
      }),
    ),

    // NOTE: The process in callback URL.
    provideStateAction(
      () => {
        const accessTokenService = inject(AccessTokenService);
        const router = inject(Router);

        return {
          // NOTE: The name of action
          set: async (accessToken, data) => {
            accessToken = await accessTokenService.setAccessToken(accessToken);

            if (data['redirectUrl']) {
              return router.navigateByUrl(`${data['redirectUrl']}`, {});
            } else if (data['close']) {
              close();
            }

            return 'Access token has been set successfully.';
          },

          broadcast: (accessToken, data) => {
            const channelName = data['channel'];

            if (!channelName) {
              throw new Error('Broadcast channel not found.');
            }

            const channel = new BroadcastChannel(`${channelName}`);
            channel.postMessage({
              type: 'success',
              data: accessToken,
            } as BroadcastData);

            return new Promise((resolve) => {
              channel.addEventListener('message', () => {
                resolve('Access token has been set by another process.');

                channel.close();

                if (data['close']) {
                  close();
                }
              });
            });
          },
        };
      },

      // NOTE: When the server return error
      withErrorHandler(() => {
        const router = inject(Router);

        return (err, stateData) => {
          const errData: BroadcastData = {
            type: 'error',
            error: err,
          };

          if (stateData?.action) {
            const { data } = parseStateAction(stateData.action);

            if (data['channel']) {
              const channel = new BroadcastChannel(`${data['channel']}`);

              channel.addEventListener('message', () => {
                channel.close();

                if (data['close']) {
                  close();
                }
              });

              channel.postMessage(errData);
            } else if (data['redirectUrl']) {
              router.navigateByUrl(`${data['redirectUrl']}`, {
                state: {
                  error: errData,
                },
              });
            }
          }
        };
      }),
    ),
    provideIdToken(idTokenConfig),
  ],
};
