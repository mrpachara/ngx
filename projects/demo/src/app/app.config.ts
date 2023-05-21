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
  Oauth2ClientConfig,
  StateActionInfo,
  StateActionType,
  parseStateAction,
  provideAccessToken,
  provideAuthorizationCode,
  provideKeyValuePairStorage,
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

const accessTokenConfig: AccessTokenConfig = {
  name: 'google',
  debug: true,
};

const authorizationCodeConfig: AuthorizationCodeConfig = {
  name: 'google',
  debug: true,
  authorizationCodeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  redirectUri: 'http://localhost:4200/google/authorization',
  pkce: 'S256',
  additionalParams: {
    prompt: 'consent',
    access_type: 'offline',
  },
};

type BroadcastData =
  | {
      type: 'success';
      data: AccessToken;
    }
  | {
      type: 'error';
      message: string;
    };

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),
    provideKeyValuePairStorage(),
    provideOauth2Client(clientConfig),
    provideAuthorizationCode(authorizationCodeConfig),
    provideAccessToken(
      accessTokenConfig,
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

              const scopes = (scopeText || 'email').split(/\s+/) as [
                string,
                ...string[],
              ];
              const isNewTab = confirm('Open in new tab');
              const useBroadcast = isNewTab && confirm('Use broadcast');

              const stateActionInfo: StateActionInfo = {
                action: 'unknown',
                data: {},
              };

              if (useBroadcast && typeof BroadcastChannel !== 'undefined') {
                const channelName = randomString(8);
                const channel = new BroadcastChannel(channelName);

                channel.addEventListener('message', (ev) => {
                  const data = ev.data as BroadcastData;

                  if (data.type === 'success') {
                    resolve(data.data);
                    channel.postMessage(true);
                  } else {
                    reject(new Error(data.message));
                    channel.postMessage(false);
                  }

                  channel.close();
                });

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
    provideStateAction(
      () => {
        const accessTokenService = inject(AccessTokenService);
        const router = inject(Router);

        return {
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
      withErrorHandler(() => {
        const router = inject(Router);

        return (err, stateData) => {
          const errData: BroadcastData = {
            type: 'error',
            message: `${err}`,
          };

          if (stateData?.['action']) {
            const { data } = parseStateAction(
              stateData['action'] as StateActionType,
            );

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
  ],
};
