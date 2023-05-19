import { ApplicationConfig, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import {
  AccessTokenConfig,
  Oauth2Client,
  Oauth2ClientConfig,
  provideAccessToken,
  provideKeyValuePairStorage,
  provideOauth2Client,
  withRenewAccessTokenSource,
} from '@mrpachara/ngx-oauth2-access-token';

import { routes } from './app.routes';

const clientConfig: Oauth2ClientConfig = {
  name: 'oauth2',
  clientId: 'CLIENT_ID',
  accessTokenUrl: '//localhost/oauth/v2/token',
  debug: true,
};

const accessTokenConfig: AccessTokenConfig = {
  name: 'oauth2',
  debug: true,
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideOauth2Client(clientConfig),
    provideKeyValuePairStorage(),
    provideAccessToken(
      accessTokenConfig,
      withRenewAccessTokenSource(() => {
        const client = inject(Oauth2Client);

        return client.requestAccessToken({
          grant_type: 'password',
          username: 'username',
          password: 'password',
          scope: 'openid',
        });
      }),
    ),
  ],
};
