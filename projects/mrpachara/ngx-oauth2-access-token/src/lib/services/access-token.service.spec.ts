import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AccessTokenService } from './access-token.service';

// const oauth2ClientConfig: Oauth2ClientConfig = {
//   name: 'test',
//   clientId: 'web-app',
//   accessTokenUrl: 'http://localhost:8080/v2/token',
//   clientCredentialsInParams: false,
// };

// const authorizationCodeConfig: AuthorizationCodeConfig = {
//   name: 'test',
//   authorizationCodeUrl: 'http://localhost:8080/authorize/consent',
//   redirectUri: 'http://localhost:4200/callback',
// };

// const accessTokenServiceConfig: AccessTokenConfig = {
//   name: 'oauth2',
// };

describe('AccessTokenService', () => {
  let service: AccessTokenService;
  // let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AccessTokenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('can respond access token for password grant', () => {
    // const expectedData: AccessTokenResponse = {
    //   token_type: 'Bearer',
    //   access_token: 'acess-token',
    //   expires_in: 30 * 60,
    //   refresh_token: 'refresh-token',
    // };

    expect(service).toBeTruthy();
  });
});
