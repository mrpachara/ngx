import { ApplicationRef, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import {
  AccessTokenService,
  AuthorizationCodeService,
} from '@mrpachara/ngx-oauth2-access-token';
import { IdTokenExtractor } from '@mrpachara/ngx-oauth2-access-token/extractors';
import { JwkDispatcher } from '@mrpachara/ngx-oauth2-access-token/jwk';
import { Home } from './home';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  // Mock dependencies
  const mockAccessTokenService = {
    responseResource: vi.fn(),
    fetch: vi.fn(),
    clearTokens: vi.fn(),
  };

  const mockAuthorizationCodeService = {
    generateUrl: vi.fn(),
  };

  const mockIdTokenExtractor = {
    infoResource: vi.fn(),
    claimsResource: vi.fn(),
  };

  const mockJwkDispatcher = {
    verify: vi.fn(),
  };

  const mockRouter = {
    url: '/home',
  };

  // State signals to simulate resource behavior
  const accessTokenValue = signal<unknown>(undefined);
  const accessTokenError = signal<Error | undefined>(undefined);
  const idTokenInfoValue = signal<unknown>(undefined);
  const idTokenClaimsValue = signal<unknown>(undefined);

  const createMockResource = (
    valSignal: () => unknown,
    errSignal: () => Error | undefined = () => undefined,
  ) => ({
    value: valSignal,
    error: errSignal,
    isLoading: signal(false),
    hasValue: () => !!valSignal(),
  });

  beforeEach(async () => {
    vi.restoreAllMocks();

    // Reset signal states
    accessTokenValue.set(undefined);
    accessTokenError.set(undefined);
    idTokenInfoValue.set(undefined);
    idTokenClaimsValue.set(undefined);

    // Setup mock returns
    mockAccessTokenService.responseResource.mockReturnValue(
      createMockResource(accessTokenValue, accessTokenError),
    );
    mockIdTokenExtractor.infoResource.mockReturnValue(
      createMockResource(idTokenInfoValue),
    );
    mockIdTokenExtractor.claimsResource.mockReturnValue(
      createMockResource(idTokenClaimsValue),
    );

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        { provide: AccessTokenService, useValue: mockAccessTokenService },
        {
          provide: AuthorizationCodeService,
          useValue: mockAuthorizationCodeService,
        },
        { provide: IdTokenExtractor, useValue: mockIdTokenExtractor },
        { provide: JwkDispatcher, useValue: mockJwkDispatcher },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('renewAccessToken', () => {
    it('should call fetch with "refresh_token"', async () => {
      mockAccessTokenService.fetch.mockResolvedValue({} as never);
      await component.renewAccessToken();
      expect(mockAccessTokenService.fetch).toHaveBeenCalledWith(
        'refresh_token',
      );
    });
  });

  describe('clearAccessToken', () => {
    it('should call clearTokens on the service', async () => {
      mockAccessTokenService.clearTokens.mockResolvedValue(void 0);
      await component.clearAccessToken();
      expect(mockAccessTokenService.clearTokens).toHaveBeenCalled();
    });
  });

  describe('authorization', () => {
    it('should generate authorization URL and redirect using location.href', async () => {
      const mockUrl = new URL('https://auth.example.com/oauth2');
      mockAuthorizationCodeService.generateUrl.mockResolvedValue(mockUrl);

      // Mock global location
      const locationMock = { href: '' };
      vi.stubGlobal('location', locationMock);

      // authorization is a protected method
      await component['authorization']();

      expect(mockAuthorizationCodeService.generateUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ intendedUrl: '/home' }),
        expect.anything(),
      );
      expect(locationMock.href).toBe(mockUrl.toString());

      vi.unstubAllGlobals();
    });
  });

  describe('Resource Error Handling', () => {
    it('should extract error message from stack if available', async () => {
      const error = new Error('Test error');
      error.stack = 'Custom Stack Line\nSecond Line';
      accessTokenError.set(error);

      fixture.detectChanges();
      // Wait for signals and resources to stabilize
      await TestBed.inject(ApplicationRef).whenStable();

      expect(component['errorAccessTokenMessage']()).toBe('Custom Stack Line');
    });

    it('should return null for error message when no error exists', () => {
      expect(component['errorAccessTokenMessage']()).toBeNull();
    });
  });
});
