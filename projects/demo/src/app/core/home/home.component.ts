import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

import { AccessTokenService } from '@mrpachara/ngx-oauth2-access-token';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly accessToken = toSignal(
    inject(AccessTokenService)
      .fetchAccessToken()
      .pipe(
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
}
