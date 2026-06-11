import {
  HttpClient,
  HttpContext,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';

import { ApplicationRef } from '@angular/core';
import { AccessTokenNotFoundError } from '../errors';
import { AccessTokenService } from '../services';
import { IdKey, OAT_REQUEST, WITH_ACCESS_TOKEN, createIdKey } from '../tokens';
import { createAssignAccessTokenInterceptor } from './access-token';

const id = createIdKey('test-interceptor');

describe('createAssignAccessTokenInterceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let accessTokenServiceMock: {
    loadAccessTokenInfo: Mock<
      () => Promise<{ type: string; token: string } | null>
    >;
    id: IdKey;
  };

  function setup(inParams: boolean | string = false) {
    accessTokenServiceMock = {
      loadAccessTokenInfo:
        vi.fn<() => Promise<{ type: string; token: string } | null>>(),
      id,
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([createAssignAccessTokenInterceptor(inParams)]),
        ),
        provideHttpClientTesting(),
        { provide: AccessTokenService, useValue: accessTokenServiceMock },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    httpTestingController.verify({ ignoreCancelled: true });
  });

  it('should not modify the request if WITH_ACCESS_TOKEN context is not present', () => {
    setup();
    httpClient.get('/api/test').subscribe();

    const req = httpTestingController.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should not modify the request if OAT_REQUEST is set to true', () => {
    setup();
    const context = new HttpContext()
      .set(WITH_ACCESS_TOKEN, true)
      .set(OAT_REQUEST, true);
    httpClient.get('/api/test', { context }).subscribe();

    const req = httpTestingController.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should add Authorization header when WITH_ACCESS_TOKEN is true and inParams is false', async () => {
    setup(false);
    accessTokenServiceMock.loadAccessTokenInfo.mockResolvedValue({
      type: 'Bearer',
      token: 'mock-token-data',
    });

    const context = new HttpContext().set(WITH_ACCESS_TOKEN, true);
    httpClient.get('/api/test', { context }).subscribe();

    await TestBed.inject(ApplicationRef).whenStable();

    const req = httpTestingController.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe(
      'Bearer mock-token-data',
    );
    req.flush({});
  });

  it('should add default access_token query parameter when inParams is true', async () => {
    setup(true);
    accessTokenServiceMock.loadAccessTokenInfo.mockResolvedValue({
      type: 'Bearer',
      token: 'query-token',
    });

    const context = new HttpContext().set(WITH_ACCESS_TOKEN, true);
    httpClient.get('/api/test', { context }).subscribe();

    await TestBed.inject(ApplicationRef).whenStable();

    const req = httpTestingController.expectOne((r) => r.url === '/api/test');
    expect(req.request.params.get('access_token')).toBe('query-token');
    req.flush({});
  });

  it('should add a custom query parameter when inParams is a string', async () => {
    setup('custom_param');
    accessTokenServiceMock.loadAccessTokenInfo.mockResolvedValue({
      type: 'Bearer',
      token: 'custom-token',
    });

    const context = new HttpContext().set(WITH_ACCESS_TOKEN, true);
    httpClient.get('/api/test', { context }).subscribe();

    await TestBed.inject(ApplicationRef).whenStable();

    const req = httpTestingController.expectOne((r) => r.url === '/api/test');
    expect(req.request.params.get('custom_param')).toBe('custom-token');
    req.flush({});
  });

  it('should throw AccessTokenNotFoundError if the service returns null info', async () => {
    setup();
    accessTokenServiceMock.loadAccessTokenInfo.mockResolvedValue(null);

    const context = new HttpContext().set(WITH_ACCESS_TOKEN, true);
    let error: AccessTokenNotFoundError | undefined;
    httpClient.get('/api/test', { context }).subscribe({
      error: (e: unknown) => (error = e as AccessTokenNotFoundError),
    });

    await TestBed.inject(ApplicationRef).whenStable();

    expect(error).toBeInstanceOf(AccessTokenNotFoundError);
  });
});
