import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { inputBinding, signal } from '@angular/core';
import { authorizationCodeCallback } from '../../helpers';
import {
  AuthorizationCodeCallback,
  provideAuthorizationCodeCallbackData,
} from './autorization-code-callback';

// Mock the helper
vi.mock('../../helpers', () => ({
  authorizationCodeCallback: vi.fn(),
}));

const mockAuthorizationCodeCallback = vi.mocked(authorizationCodeCallback);

describe('AuthorizationCodeCallback', () => {
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
    mockAuthorizationCodeCallback.mockReset();
    mockAction.mockReset();

    code.set(undefined);
    state.set(undefined);
    error.set(undefined);
    error_description.set(undefined);

    await TestBed.configureTestingModule({
      imports: [AuthorizationCodeCallback],
      providers: provideAuthorizationCodeCallbackData(() => mockData),
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

    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call authorizationCodeCallback and run action on success', async () => {
      const stateData = { user: 'test' };
      mockAuthorizationCodeCallback.mockResolvedValue(stateData);

      state.set('the-state');
      code.set('the-code');

      fixture.detectChanges();
      await component.ngOnInit();

      expect(mockAuthorizationCodeCallback).toHaveBeenCalledWith(
        'the-state',
        'the-code',
        undefined,
        undefined,
        expect.anything(),
      );
      expect(mockAction).toHaveBeenCalledWith(stateData);
      expect(component['messageInfo']()).toBeUndefined();
    });

    it('should display error message when callback rejects', async () => {
      const mockError = new Error('failure');
      mockAuthorizationCodeCallback.mockRejectedValue(mockError);

      state.set('state');
      error.set('access_denied');

      fixture.detectChanges();
      await component.ngOnInit();

      expect(component['messageInfo']()).toEqual({
        type: 'error',
        message: 'Error: failure',
      });
    });
  });

  describe('messageClass', () => {
    it('should reflect the message type', () => {
      component['messageInfo'].set({ type: 'info', message: 'ok' });
      expect(component['messageClass']()).toBe('oat-cl-info');

      component['messageInfo'].set({ type: 'error', message: 'bad' });
      expect(component['messageClass']()).toBe('oat-cl-error');

      component['messageInfo'].set(undefined);
      expect(component['messageClass']()).toBe('oat-cl-none');
    });
  });
});
