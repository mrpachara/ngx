import { ApplicationConfig, inject } from '@angular/core';
import {
  Router,
  provideRouter,
  withComponentInputBinding,
} from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { defer } from 'rxjs';

import { clientId, clientSecret } from '../secrets/oauth-client';

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
  withAccessTokenResponseExtractor,
  withRenewAccessTokenSource,
  withStateActionErrorHandler,
  withStateActionHandler,
} from '@mrpachara/ngx-oauth2-access-token';

import { routes } from './app.routes';

const clientConfig: Oauth2ClientConfig = {
  name: 'google',
  debug: true,
  clientId: clientId,
  clientSecret: clientSecret,
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

// NOTE: configIdToken() returns the full configuration
//       from the given optional configuration.
const idTokenFullConfig = configIdToken({
  providedInAccessToken: false,
});

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
                // NOTE: It's safe to throw here because it's out of asynchronous process.
                //       In asychronous process, we have to use reject();
                throw new Error('Authorization was canceled.');
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

                const teardown = () => {
                  channel.close();
                };

                channel.addEventListener('message', (ev) => {
                  const data = ev.data as BroadcastData;

                  if (data.type === 'success') {
                    resolve(data.data);
                    channel.postMessage(true);
                  } else {
                    reject(data.error);
                    channel.postMessage(false);
                  }

                  teardown();
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

      // NOTE: Add ID token extractor for getting information
      //       from access token response.
      withAccessTokenResponseExtractor(IdTokenService, idTokenFullConfig),
    ),

    // NOTE: The process in callback URL.
    provideStateAction(
      // NOTE: Use StateActionInfo to determine the types of handler
      withStateActionHandler<BroadcastActionInfo>('broadcast', () => {
        return (accessTokenResponse, stateData) => {
          const data = stateData.action.data;

          const channelName = data.channel;

          const channel = new BroadcastChannel(`${channelName}`);
          channel.postMessage({
            type: 'success',
            data: accessTokenResponse,
          } as BroadcastData);

          const teardown = () => {
            channel.close();

            if (data.close) {
              close();
            }
          };

          return new Promise((resolve) => {
            channel.addEventListener('message', () => {
              resolve('Access token has been set by another process.');

              teardown();
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
          const errData: BroadcastData = {
            type: 'error',
            error: err,
          };

          if (stateData?.action) {
            const sharedActionInfo = stateData.action as
              | BroadcastActionInfo
              | SetActionInfo;

            if (sharedActionInfo.name === 'broadcast') {
              // NOTE: From literal type, sharedActionInfo must automatically
              //       be BroadcastActionInfo.

              const data = sharedActionInfo.data;
              const channel = new BroadcastChannel(`${data['channel']}`);

              const teardown = () => {
                channel.close();

                if (sharedActionInfo.data.close) {
                  close();
                }
              };

              channel.addEventListener('message', () => {
                teardown();
              });

              channel.postMessage(errData);
            } else {
              // NOTE: From literal type, sharedActionInfo must automatically
              //       be SetActionInfo.

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
