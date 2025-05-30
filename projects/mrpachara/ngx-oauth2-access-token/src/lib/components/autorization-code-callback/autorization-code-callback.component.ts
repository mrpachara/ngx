import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  OnInit,
  Provider,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import { authorizationCodeCallback } from '../../helpers';
import { injectAuthorizationCodeService } from '../../tokens';

export interface AuthorizationCodeCallbackData<T = unknown> {
  readonly id: symbol;
  readonly processFactory?: () => (stateData: T) => Promise<void> | void;
}

const AUTHORIZATION_CODE_CALLBACK_DATA =
  new InjectionToken<AuthorizationCodeCallbackData>(
    'authorization-code-callback-data',
  );

export function provideAuthorizationCodeCallbackData<T>(
  factory: () => AuthorizationCodeCallbackData<T>,
): Provider[] {
  return [{ provide: AUTHORIZATION_CODE_CALLBACK_DATA, useFactory: factory }];
}

interface MessageInfo {
  type: 'info' | 'error';
  message: string;
}

/**
 * The simple component for handling authorization code callback URL processes.
 * It can work with `withComponentInputBinding()`.
 */
@Component({
  selector: 'oat-authorization-code-callback',
  imports: [NgClass],
  templateUrl: './autorization-code-callback.component.html',
  styleUrls: ['./autorization-code-callback.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorizationCodeCallbackComponent<T> implements OnInit {
  private readonly data = inject<AuthorizationCodeCallbackData<T>>(
    AUTHORIZATION_CODE_CALLBACK_DATA,
  );

  private readonly authorizationCodeService = injectAuthorizationCodeService(
    this.data.id,
  );

  private readonly process = this.data.processFactory?.();

  readonly processFactory = input;

  readonly state = input<string>();

  readonly code = input<string>();

  readonly error = input<string>();

  readonly errro_description = input<string>();

  protected readonly messageInfo = signal<MessageInfo | undefined>(undefined);

  protected readonly messageClass = computed(
    () => `oat-cl-${this.messageInfo()?.type ?? 'none'}` as const,
  );

  async ngOnInit(): Promise<void> {
    try {
      const stateData = await authorizationCodeCallback<T>(
        this.state(),
        this.code(),
        this.error(),
        this.errro_description(),
        this.authorizationCodeService,
      );

      await this.process?.(stateData);
    } catch (err) {
      this.messageInfo.set({
        type: 'error',
        message: `${err}`,
      });

      console.error(err);
    }
  }
}
