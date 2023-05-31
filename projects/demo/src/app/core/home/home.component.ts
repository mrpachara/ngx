import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, from, of } from 'rxjs';

import {
  AccessTokenService,
  IdTokenService,
} from '@mrpachara/ngx-oauth2-access-token';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly accessTokenService = inject(AccessTokenService);
  private readonly idTokenService = inject(IdTokenService);

  protected readonly errorAccessTokenMessage = signal<string | null>(null);
  protected readonly errorIdTokenMessage = signal<string | null>(null);

  protected readonly accessToken = toSignal(
    this.accessTokenService.fetchToken().pipe(
      catchError((err) => {
        if (typeof err.stack === 'string') {
          const [message] = err.stack.split('\n', 1);
          this.errorAccessTokenMessage.set(message);
        } else {
          this.errorAccessTokenMessage.set(`${err}`);
        }

        return of(undefined);
      }),
    ),
  );

  // NOTE: Unlike async pipe ( | async), toSignal() subscribes observable here.
  //       So the result could be evaluated before it is ready.
  protected readonly idToken = toSignal(
    from(this.accessTokenService.extract(this.idTokenService)).pipe(
      catchError((err) => {
        if (typeof err.stack === 'string') {
          const [message] = err.stack.split('\n', 1);
          this.errorIdTokenMessage.set(message);
        } else {
          this.errorIdTokenMessage.set(`${err}`);
        }
        return of(undefined);
      }),
    ),
  );
}
