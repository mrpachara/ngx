import { ApplicationConfig, inject } from '@angular/core';
import {
  Router,
  provideRouter,
  withComponentInputBinding,
} from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import {
  AccessTokenConfig,
  AccessTokenResponse,
  AccessTokenService,
  AuthorizationCodeConfig,
  AuthorizationCodeService,
  IdTokenService,
  Oauth2ClientConfig,
  Scopes,
  StateActionInfo,
  configIdToken,
  provideAccessToken,
  provideAuthorizationCode,
  provideKeyValuePairStorage,
  provideOauth2Client,
  provideStateAction,
  randomString,
  withAccessTokenResponseListener,
  withRenewAccessTokenSource,
  withStateActionErrorHandler,
  withStateActionHandler,
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
    close?: boolean;
    redirectUrl?: string;
  }
>;

type SetActionInfo = StateActionInfo<
  'set',
  {
    close?: boolean;
    redirectUrl?: string;
  }
>;

export const appConfig: ApplicationConfig = {
  providers: [
    // NOTE: withComponentInputBinding() will atomatically bind
    //       query strings to component inputs.
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),

    // NOTE: The ngx-oauth2-access-token provide functions
    provideKeyValuePairStorage(1n), // This is needed now.
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
            new Promise<AccessTokenResponse>((resolve, reject) => {
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
                name: 'unknown',
                data: {},
              };

              if (useBroadcast) {
                const broadcastActionInfo =
                  stateActionInfo as BroadcastActionInfo;

                // NOTE: The name of action will be performed in the callback URL.
                //       And the data using in the callback URL.
                broadcastActionInfo.name = 'broadcast';

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

                broadcastActionInfo.data = {
                  channel: channelName,
                };
              } else {
                const setActionInfo = stateActionInfo as SetActionInfo;

                setActionInfo.name = 'set';
              }

              const sharedActionInfo = stateActionInfo as
                | BroadcastActionInfo
                | SetActionInfo;

              if (isNewTab) {
                sharedActionInfo.data.close = false;
              } else {
                sharedActionInfo.data.redirectUrl = router.url;
              }

              (async () => {
                const url =
                  await authorizationCodeService.fetchAuthorizationCodeUrl(
                    scopes,
                    {
                      action: sharedActionInfo,
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

      withAccessTokenResponseListener(IdTokenService, configIdToken({})),
    ),

    // NOTE: The process in callback URL.
    provideStateAction(
      // NOTE: Use StateActionInfo to determine the types of handler
      withStateActionHandler<BroadcastActionInfo>('broadcast', () => {
        return (accessTokenResponse, stateData) => {
          const data = stateData.action.data;

          const channelName = data.channel;

          if (!channelName) {
            throw new Error('Broadcast channel not found.');
          }

          const channel = new BroadcastChannel(`${channelName}`);
          channel.postMessage({
            type: 'success',
            data: accessTokenResponse,
          } as BroadcastData);

          return new Promise((resolve) => {
            channel.addEventListener('message', () => {
              resolve('Access token has been set by another process.');

              channel.close();

              if (data.close) {
                close();
              }
            });
          });
        };
      }),

      withStateActionHandler<SetActionInfo>('set', () => {
        const accessTokenService = inject(AccessTokenService);
        const router = inject(Router);

        return async (accessTokenResponse, stateData) => {
          await accessTokenService.setAccessTokenResponse(accessTokenResponse);

          const data = stateData.action.data;

          if (data.redirectUrl) {
            return router.navigateByUrl(`${data.redirectUrl}`, {});
          } else if (data.close) {
            close();
          }

          return 'Access token has been set successfully.';
        };
      }),

      // NOTE: When the server return error
      withStateActionErrorHandler(() => {
        const router = inject(Router);

        return (err, stateData) => {
          console.debug(err, stateData);
          const errData: BroadcastData = {
            type: 'error',
            error: err,
          };

          if (stateData?.action) {
            const sharedActionInfo = stateData.action as
              | BroadcastActionInfo
              | SetActionInfo;

            if (sharedActionInfo.name === 'broadcast') {
              const data = sharedActionInfo.data;
              const channel = new BroadcastChannel(`${data['channel']}`);

              channel.addEventListener('message', () => {
                channel.close();

                if (sharedActionInfo.data.close) {
                  close();
                }
              });

              channel.postMessage(errData);
            } else {
              const data = sharedActionInfo.data;

              if (data.redirectUrl) {
                router.navigateByUrl(`${data.redirectUrl}`, {
                  state: {
                    error: errData,
                  },
                });
              }
            }
          }
        };
      }),
    ),
  ],
};
