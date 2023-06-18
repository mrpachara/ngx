import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { take } from 'rxjs';

import { oauth2Callback } from '../../functions';
import { AuthorizationCodeService, StateActionService } from '../../services';

type MessageInfo = {
  type: 'info' | 'error' | null;
  message: string | null;
};

function nullableAttribute(value: string | undefined) {
  return value ?? null;
}

/**
 * The simple component for handling authorization code callback URL processes.
 * It can work with `withComponentInputBinding()`.
 */
@Component({
  selector: 'oat-authorization-code-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './autorization-code-callback.component.html',
  styleUrls: ['./autorization-code-callback.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorizationCodeCallbackComponent implements OnInit {
  protected readonly messageInfo = signal<MessageInfo>({
    type: null,
    message: null,
  });

  protected readonly messageClass = computed(
    () => `cl-${this.messageInfo().type}`,
  );

  @Input({ transform: nullableAttribute }) state: string | null = null;
  @Input({ transform: nullableAttribute }) code: string | null = null;
  @Input({ transform: nullableAttribute }) error: string | null = null;
  @Input({ transform: nullableAttribute }) errro_description: string | null =
    null;

  private readonly authorizationCodeService = inject(AuthorizationCodeService);
  private readonly stateActionService = inject(StateActionService);

  ngOnInit(): void {
    oauth2Callback(
      this.state,
      this.code,
      this.error,
      this.errro_description,
      this.authorizationCodeService,
      this.stateActionService,
    )
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          this.messageInfo.set({
            type: 'info',
            message: `${result}`,
          });
        },
        error: (err) => {
          this.messageInfo.set({
            type: 'error',
            message: `${err}`,
          });

          console.error(err);
        },
      });
  }
}
