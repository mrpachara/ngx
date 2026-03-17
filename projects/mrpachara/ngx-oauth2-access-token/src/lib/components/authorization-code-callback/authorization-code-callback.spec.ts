import { ApplicationRef, inputBinding, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthorizationCodeService } from '../../services';
import { createIdKey } from '../../tokens/common';
import {
  AuthorizationCodeCallback,
  provideAuthorizationCodeCallbackData,
} from './authorization-code-callback';

// Mock dependencies
const mockAuthorizationCodeService = {
  id: createIdKey('test'),
  generateUrl: vi.fn(),
  exchangeCode: vi.fn(),
  clearState: vi.fn(),
};

describe('AuthorizationCodeCallback - without id', () => {
  let fixture: ComponentFixture<AuthorizationCodeCallback<unknown>>;
  let component: AuthorizationCodeCallback<unknown>;

  const code = signal<string | undefined>(undefined);
  const state = signal<string | undefined>(undefined);
  const error = signal<string | undefined>(undefined);
  const error_description = signal<string | undefined>(undefined);

  const mockData = {
    actionFactory: vi.fn(() => vi.fn()),
  };

  const mockAction = vi.fn();

  beforeEach(async () => {
    mockData.actionFactory.mockReturnValue(mockAction);
    mockAction.mockReset();
    mockAuthorizationCodeService.generateUrl.mockReset();
    mockAuthorizationCodeService.exchangeCode.mockReset();
    mockAuthorizationCodeService.clearState.mockReset();

    code.set(undefined);
    state.set(undefined);
    error.set(undefined);
    error_description.set(undefined);

    await TestBed.configureTestingModule({
      imports: [AuthorizationCodeCallback],
      providers: [
        {
          provide: AuthorizationCodeService,
          useValue: mockAuthorizationCodeService,
        },
        provideAuthorizationCodeCallbackData(() => mockData),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthorizationCodeCallback, {
      bindings: [
        inputBinding('code', code),
        inputBinding('state', state),
        inputBinding('error', error),
        inputBinding('error_description', error_description),
      ],
    });
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call authorizationCodeCallback and run action on success', async () => {
      const stateData = { user: 'test' };

      mockAuthorizationCodeService.exchangeCode.mockResolvedValue(stateData);

      state.set('the-state');
      code.set('the-code');

      fixture.detectChanges();
      // NOTE: Cannot use fixture.whenStable() here because we have to wait for async ngOnInit,
      // which is not part of Angular's change detection cycle.
      // Instead, we need to wait for all async operations to complete using ApplicationRef.
      await TestBed.inject(ApplicationRef).whenStable();

      expect(mockAuthorizationCodeService.exchangeCode).toHaveBeenCalledTimes(
        1,
      );

      expect(mockAuthorizationCodeService.exchangeCode).toHaveBeenCalledWith(
        'the-state',
        'the-code',
      );

      expect(mockAction).toHaveBeenCalledWith(stateData);
      expect(component['messageInfo']()).toBeUndefined();
    });

    it('should display error message when callback rejects', async () => {
      state.set('state');
      error.set('access_denied');

      fixture.detectChanges();
      // NOTE: Cannot use fixture.whenStable() here because we have to wait for async ngOnInit,
      // which is not part of Angular's change detection cycle.
      // Instead, we need to wait for all async operations to complete using ApplicationRef.
      await TestBed.inject(ApplicationRef).whenStable();

      expect(component['messageInfo']()).toEqual({
        type: 'error',
        message: 'access_denied: access_denied',
      });
    });
  });

  describe('messageClass', () => {
    it('should reflect the message type', async () => {
      state.set('the-state');
      code.set('the-code');

      fixture.detectChanges();
      // NOTE: Cannot use fixture.whenStable() here because we have to wait for async ngOnInit,
      // which is not part of Angular's change detection cycle.
      // Instead, we need to wait for all async operations to complete using ApplicationRef.
      await TestBed.inject(ApplicationRef).whenStable();

      component['messageInfo'].set({ type: 'info', message: 'ok' });
      expect(component['messageClass']()).toBe('oat-cl-info');

      component['messageInfo'].set({ type: 'error', message: 'bad' });
      expect(component['messageClass']()).toBe('oat-cl-error');

      component['messageInfo'].set(undefined);
      expect(component['messageClass']()).toBe('oat-cl-none');
    });
  });
});
