import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

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

  protected readonly errorMessage = signal<string | null>(null);

  protected readonly accessToken = toSignal(
    this.accessTokenService.fetchAccessToken().pipe(
      catchError((err) => {
        if (typeof err.stack === 'string') {
          const [message] = err.stack.split('\n', 1);
          this.errorMessage.set(message);
        } else {
          this.errorMessage.set(`${err}`);
        }

        return of({});
      }),
    ),
  );

  // NOTE: Unlike async pipe ( | async), toSignal() subscribes observable here.
  //       So the result could be evaluated before it is ready. In this case we
  //       use accessTokenService.ready() to make sure it is ready.
  protected readonly idToken = toSignal(
    this.accessTokenService
      .ready((serviceName) => this.idTokenService.fetchIdToken(serviceName))
      .pipe(
        catchError((err) => {
          if (typeof err.stack === 'string') {
            const [message] = err.stack.split('\n', 1);
            this.errorMessage.set(message);
          } else {
            this.errorMessage.set(`${err}`);
          }
          return of(undefined);
        }),
      ),
  );
}
