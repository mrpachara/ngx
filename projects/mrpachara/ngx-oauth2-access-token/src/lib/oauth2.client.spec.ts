import {
  HttpClientTestingModule,
  HttpTestingController,
  TestRequest,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { isOauthError } from './functions';

import { Oauth2Client } from './oauth2.client';
import { OAUTH2_CLIENT_CONFIG } from './tokens';
import {
  AccessToken,
  Oauth2ClientConfig,
  PasswordGrantParams,
  StandardGrantTypes,
} from './types';

export const http401 = {
  status: 401,
  statusText: 'Unauthorized',
};

export const oauth2ClientConfig: Oauth2ClientConfig = {
  clientId: 'web-app',
  clientSecret: null,
  accessTokenUrl: 'http://localhost:8080/v2/token',
  authorizationCodeUrl: 'http://localhost:8080/authorize/consent',
  clientCredentialsInParams: false,
};

export const passwordGrantParms: PasswordGrantParams = {
  grant_type: 'password',
  username: 'example',
  password: '1234',
  scope: 'basic',
  state: 'abcdxyz',
};

export const expectedAccesToken: AccessToken = {
  token_type: 'Bearer',
  access_token: 'accessp-token-xyz123',
  expires_in: 30 * 60,
  refresh_token: 'refresh-toke-xyz123',
};

export const oauth2ErrorResponse = {
  error: 'error',
  error_description: 'error_message',
};

export const expectAccessToken = (
  req: TestRequest,
  type: StandardGrantTypes,
  config: Oauth2ClientConfig,
): void => {
  expect(req.request.method).withContext('request method').toEqual('POST');
  expect(req.request.headers.get('Authorization'))
    .withContext('has Authorization header')
    .toBeTruthy();
  const [authzType, authzValue] = req.request.headers
    .get('Authorization')!
    .split(' ', 2);
  const authHeaderEncoded = `${authzType} ${atob(authzValue)}`;
  expect(authHeaderEncoded)
    .withContext('Authorization value')
    .toEqual(`Basic ${config.clientId}:${config.clientSecret}`);
  expect(req.request.body?.['grant_type'])
    .withContext('grant_type')
    .toEqual(type);
};

describe('Oauth2Client', () => {
  let service: Oauth2Client;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: OAUTH2_CLIENT_CONFIG, useValue: oauth2ClientConfig },
      ],
    });
    service = TestBed.inject(Oauth2Client);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('can respond access token for password grant', () => {
    service.requestAccessToken(passwordGrantParms).subscribe({
      next: (accessToken) =>
        expect(accessToken)
          .withContext('access-token')
          .toEqual(expectedAccesToken),
      error: (err: unknown) =>
        fail('should respond access token without error'),
    });

    const req = httpTestingController.expectOne(
      oauth2ClientConfig.accessTokenUrl,
      'no or more than one request occure',
    );

    expectAccessToken(req, 'password', oauth2ClientConfig);

    req.flush(expectedAccesToken);
  });

  it('can respond fail for password grant', () => {
    service.requestAccessToken(passwordGrantParms).subscribe({
      next: () => fail('should respond fail with 401'),
      error: (err: unknown) => {
        expect(isOauthError(err))
          .withContext('error is Oauth error')
          .toBeTrue();
        expect(err).withContext('error').toEqual(oauth2ErrorResponse);
      },
    });

    const req = httpTestingController.expectOne(
      oauth2ClientConfig.accessTokenUrl,
      'no or more than one request occure',
    );

    expectAccessToken(req, 'password', oauth2ClientConfig);

    req.flush(oauth2ErrorResponse, http401);
  });

  afterEach(() => {
    // After every test, assert that there are no more pending requests.
    if (httpTestingController) {
      httpTestingController.verify();
    }
  });
});
