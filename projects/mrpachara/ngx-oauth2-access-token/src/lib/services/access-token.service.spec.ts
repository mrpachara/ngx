import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AccessTokenService } from './access-token.service';
import { NGX_OAUTH2_ACCESS_TOKEN_PROVIDERS } from './ngx-oauth2-access-token.module';
import { ACCESS_TOKEN_CONFIG, OAUTH2_CLIENT_CONFIG } from './tokens';
import { AccessToken, AccessTokenConfig, Oauth2ClientConfig } from './types';

const oauth2ClientConfig: Oauth2ClientConfig = {
  name: 'test',
  clientId: 'web-app',
  accessTokenUrl: 'http://localhost:8080/v2/token',
  authorizationCodeUrl: 'http://localhost:8080/authorize/consent',
  clientCredentialsInParams: false,
};

const accessTokenServiceConfig: AccessTokenConfig = {
  name: 'oauth2',
};

describe('AccessTokenService', () => {
  let service: AccessTokenService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ...NGX_OAUTH2_ACCESS_TOKEN_PROVIDERS,
        { provide: OAUTH2_CLIENT_CONFIG, useValue: oauth2ClientConfig },
        {
          provide: ACCESS_TOKEN_CONFIG,
          useValue: accessTokenServiceConfig,
        },
      ],
    });
    service = TestBed.inject(AccessTokenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('can respond access token for password grant', () => {
    const expectedData: AccessToken = {
      token_type: 'Bearer',
      access_token: 'acess-token',
      expires_in: 30 * 60,
      refresh_token: 'refresh-token',
    };

    expect(service).toBeTruthy();
  });
});
