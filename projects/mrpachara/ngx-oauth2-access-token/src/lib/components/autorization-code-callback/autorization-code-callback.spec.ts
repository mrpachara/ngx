import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';

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
  @Component({
    standalone: true,
    imports: [AuthorizationCodeCallback],
    template: `
      <oat-authorization-code-callback
        [state]="state"
        [code]="code"
        [error]="error"
        [error_description]="error_description"
      ></oat-authorization-code-callback>
    `,
  })
  class TestHostComponent {
    state = '';
    code = '';
    error = '';
    error_description = '';
  }

  let hostFixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let component: AuthorizationCodeCallback<unknown>;

  const mockData = {
    actionFactory: vi.fn(() => vi.fn()),
  };

  const mockAction = vi.fn();

  beforeEach(() => {
    mockData.actionFactory.mockReturnValue(mockAction);
    mockAuthorizationCodeCallback.mockReset();
    mockAction.mockReset();

    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: provideAuthorizationCodeCallbackData(() => mockData),
    });

    hostFixture = TestBed.createComponent(TestHostComponent);
    host = hostFixture.componentInstance;
    component = hostFixture.debugElement.query(
      By.directive(AuthorizationCodeCallback),
    ).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call authorizationCodeCallback and run action on success', async () => {
      const stateData = { user: 'test' };
      mockAuthorizationCodeCallback.mockResolvedValue(stateData);

      host.state = 'the-state';
      host.code = 'the-code';

      hostFixture.detectChanges();
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
      const error = new Error('failure');
      mockAuthorizationCodeCallback.mockRejectedValue(error);

      host.state = 'state';
      host.error = 'access_denied';

      hostFixture.detectChanges();
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
