import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EmptyError } from 'rxjs';

import { Oauth2ClientResponseError } from '../errors';
import { OAT_REQUEST } from '../tokens';
import { Oauth2Client } from './oauth2.client';

describe('Oauth2Client', () => {
  let service: Oauth2Client;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClientTesting()],
    });

    service = TestBed.inject(Oauth2Client);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Some tests may abort requests; the testing controller will consider those cancelled.
    httpTestingController.verify({ ignoreCancelled: true });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should POST form data with Basic auth header by default', async () => {
    const url = '/token';
    const credentials = { id: 'my-client', secret: 'my-secret' };
    const request = { grant_type: 'client_credentials' };
    const response = {
      access_token: 'abc',
      token_type: 'bearer',
      expires_in: 3600,
    };

    const promise = service.fetchAccessToken(url, credentials, request);

    const req = httpTestingController.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.context.get(OAT_REQUEST)).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe(
      `Basic ${btoa(`${credentials.id}:${credentials.secret}`)}`,
    );

    const body = req.request.body as FormData;
    expect(body.get('grant_type')).toBe('client_credentials');

    req.flush(response);
    await expect(promise).resolves.toEqual(response);
  });

  it('should include empty secret in Basic auth header when secret is missing', async () => {
    const url = '/token';
    const credentials = { id: 'my-client' };
    const request = { grant_type: 'client_credentials' };
    const response = {
      access_token: 'def',
      token_type: 'bearer',
      expires_in: 3600,
    };

    const promise = service.fetchAccessToken(url, credentials, request);

    const req = httpTestingController.expectOne(url);
    expect(req.request.headers.get('Authorization')).toBe(
      `Basic ${btoa(`${credentials.id}:`)}`,
    );

    req.flush(response);
    await expect(promise).resolves.toEqual(response);
  });

  it('should send credentials in request body when credentialsInParams is true', async () => {
    const url = '/token';
    const credentials = { id: 'my-client', secret: 'my-secret' };
    const request = { grant_type: 'client_credentials' };
    const response = {
      access_token: 'xyz',
      token_type: 'bearer',
      expires_in: 3600,
    };

    const promise = service.fetchAccessToken(url, credentials, request, {
      credentialsInParams: true,
      params: { scope: ['read', 'write'] },
    });

    const req = httpTestingController.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.has('Authorization')).toBe(false);

    const body = req.request.body as FormData;
    expect(body.get('client_id')).toBe(credentials.id);
    expect(body.get('client_secret')).toBe(credentials.secret);
    expect(body.get('grant_type')).toBe('client_credentials');
    expect(body.getAll('scope')).toEqual(['read', 'write']);

    req.flush(response);
    await expect(promise).resolves.toEqual(response);
  });

  it('should wrap http errors in Oauth2ClientResponseError', async () => {
    const url = '/token';
    const credentials = { id: 'my-client', secret: 'my-secret' };
    const request = { grant_type: 'client_credentials' };

    const promise = service.fetchAccessToken(url, credentials, request);

    const req = httpTestingController.expectOne(url);
    req.flush(
      { error: 'invalid_request', error_description: 'Invalid grant' },
      { status: 400, statusText: 'Bad Request' },
    );

    await expect(promise).rejects.toBeInstanceOf(Oauth2ClientResponseError);
    const err = await promise.catch((e) => e);
    expect(err).toBeInstanceOf(Oauth2ClientResponseError);
    expect(err.error.error).toBe('invalid_request');
    expect(err.error.error_description).toBe('Invalid grant');
    expect(err.cause).toBeTruthy();
  });

  it('should reject when aborted before response', async () => {
    const url = '/token';
    const credentials = { id: 'my-client' };
    const request = { grant_type: 'client_credentials' };
    const controller = new AbortController();

    const promise = service.fetchAccessToken(url, credentials, request, {
      signal: controller.signal,
    });

    httpTestingController.expectOne(url);
    controller.abort();

    // firstValueFrom rejects with EmptyError when observable completes without emitting
    await expect(promise).rejects.toBeInstanceOf(EmptyError);
  });
});
