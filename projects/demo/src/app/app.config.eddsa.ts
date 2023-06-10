import { ApplicationConfig, inject } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { defer } from 'rxjs';

import {
  AccessTokenConfig,
  AccessTokenResponse,
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
  name: 'my',
  clientId: 'web-app',
  accessTokenUrl: 'http://localhost:8080/v2/token',
};

const authorizationCodeConfig: AuthorizationCodeConfig = {
  name: 'my',
  authorizationCodeUrl: 'http://localhost:8080/authorize/consent',
  redirectUri: 'http://localhost:4200/google/authorization',
  pkce: 'S256',
  // NOTE: For getting refresh token from Google
  additionalParams: {
    prompt: 'consent',
    access_type: 'offline',
  },
};

const accessTokenConfig: AccessTokenConfig = {
  name: 'my',
};

// NOTE: configIdToken() returns the full configuration
//       from the given optional configuration.
const idTokenFullConfig = configIdToken({
  providedInAccessToken: true,
});

const jwkConfig: JwkConfig = {
  name: 'my',
  issuer: 'http://localhost:8080',
  jwkSetUrl: 'http://localhost:8080/.well-known/jwk-set.json',
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
    provideKeyValuePairStorage(1n), // This is needed now.
    provideOauth2Client(clientConfig),
    provideAuthorizationCode(authorizationCodeConfig),
    provideAccessToken(
      accessTokenConfig,
      // NOTE: The process for getting the new access token
      withRenewAccessTokenSource(() => {
        const authorizationCodeService = inject(AuthorizationCodeService);

        return defer(
          () =>
            new Promise<AccessTokenResponse>((resolve, reject) => {
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

              const teardown = () => {
                channel.close();
              };

              channel.addEventListener('message', (ev) => {
                const data = ev.data as BroadcastData;

                if (data.type === 'success') {
                  resolve(data.data);
                } else {
                  reject(data.error);
                }

                teardown();
              });

              (async () => {
                const url =
                  await authorizationCodeService.fetchAuthorizationCodeUrl(
                    scopes,
                    {
                      // NOTE: The name of action will be performed in the callback URL.
                      //       And the data using in the callback URL.
                      action: {
                        name: 'broadcast',
                        data: {
                          channel: channelName,
                        },
                      } as BroadcastActionInfo,
                    },
                  );

                open(url, '_blank');
              })();
            }),
        );
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
        return (err, stateData) => {
          const errData: BroadcastData = {
            type: 'error',
            error: err,
          };

          if (stateData?.action) {
            const broadcastActionInfo = stateData.action as BroadcastActionInfo;

            const data = broadcastActionInfo.data;
            const channel = new BroadcastChannel(`${data['channel']}`);

            const teardown = () => {
              channel.close();
              // close(); // close windows if needed
            };

            channel.postMessage(errData);

            teardown();
          }
        };
      }),
    ),
    provideJwk(jwkConfig),
  ],
};
