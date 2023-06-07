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

@Component({
  selector: 'oat-autorization-code-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './autorization-code-callback.component.html',
  styleUrls: ['./autorization-code-callback.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutorizationCodeCallbackComponent implements OnInit {
  protected readonly messageInfo = signal<MessageInfo>({
    type: null,
    message: null,
  });

  protected readonly messageClass = computed(
    () => `cl-${this.messageInfo().type}`,
  );

  @Input() state?: string;
  @Input() code?: string;
  @Input() error?: string;
  @Input() errro_description?: string;

  private readonly authorizationCodeService = inject(AuthorizationCodeService);
  private readonly stateActionService = inject(StateActionService);

  ngOnInit(): void {
    oauth2Callback(
      this.state ?? null,
      this.code ?? null,
      this.error ?? null,
      this.errro_description ?? null,
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
