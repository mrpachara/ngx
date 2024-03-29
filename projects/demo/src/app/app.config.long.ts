import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, inject } from '@angular/core';
import {
  Router,
  provideRouter,
  withComponentInputBinding,
} from '@angular/router';
import { Observable } from 'rxjs';

import { clientId, clientSecret } from '../secrets/oauth-client';

import {
  AccessTokenConfig,
  AccessTokenResponse,
  AccessTokenService,
  AuthorizationCodeConfig,
  AuthorizationCodeService,
  IdTokenService,
  JwkConfig,
  Oauth2ClientConfig,
  Scopes,
  StateActionInfo,
  configIdToken,
  provideAccessToken,
  provideAccessTokenResponseExtractors,
  provideAuthorizationCode,
  provideJwk,
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
    provideKeyValuePairsStorage('ngx-oat', 1), // This is needed now.
    provideOauth2Client(clientConfig),
    provideAuthorizationCode(authorizationCodeConfig),
    provideAccessToken(
      accessTokenConfig,
      // NOTE: The process for getting the new access token
      withRenewAccessTokenSource(() => {
        const authorizationCodeService = inject(AuthorizationCodeService);
        const router = inject(Router);

        return new Observable<AccessTokenResponse>((subscriber) => {
          const teardownLogics: (() => void)[] = [];
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
            const broadcastActionInfo = stateActionInfo as BroadcastActionInfo;

            // NOTE: The name of action will be performed in the callback URL.
            //       And the data using in the callback URL.
            broadcastActionInfo.name = 'broadcast';

            const channelName = randomString(8);
            const channel = new BroadcastChannel(channelName);

            teardownLogics.push(() => {
              channel.close();
            });

            channel.addEventListener('message', (ev) => {
              const data = ev.data as BroadcastData;

              if (data.type === 'success') {
                subscriber.next(data.data);
                channel.postMessage(true);
              } else {
                subscriber.error(data.error);
                channel.postMessage(false);
              }

              subscriber.complete();
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
              await authorizationCodeService.fetchAuthorizationCodeUrl(scopes, {
                action: sharedActionInfo,
              });
            if (isNewTab) {
              open(url, '_blank');
            } else {
              location.href = url.toString();
            }
          })();

          return () => {
            teardownLogics.forEach((teadownLogic) => teadownLogic());
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
        return (accessTokenResponse, stateData) => {
          const data = stateData.action.data;

          const channelName = data.channel;

          const channel = new BroadcastChannel(`${channelName}`);
          channel.postMessage({
            type: 'success',
            data: accessTokenResponse,
          } as BroadcastData);

          return new Observable((subscriber) => {
            channel.addEventListener('message', () => {
              subscriber.next('Access token has been set by another process.');
              subscriber.complete();
            });

            return () => {
              channel.close();

              if (data.close) {
                close();
              }
            };
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
              return new Observable<void>((subscriber) => {
                // NOTE: From literal type, sharedActionInfo must automatically
                //       be BroadcastActionInfo.
                const data = sharedActionInfo.data;

                const channel = new BroadcastChannel(`${data['channel']}`);

                channel.addEventListener('message', () => {
                  subscriber.next();
                  subscriber.complete();
                });

                channel.postMessage(errData);

                return () => {
                  channel.close();

                  if (sharedActionInfo.data.close) {
                    close();
                  }
                };
              });
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

              return Promise.resolve();
            }
          }

          return Promise.resolve();
        };
      }),
    ),
    provideJwk(jwkConfig),
  ],
};
