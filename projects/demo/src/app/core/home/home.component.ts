import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';

import { AccessTokenService } from '@mrpachara/ngx-oauth2-access-token';
import { catchError, of } from 'rxjs';

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
          this.errorMessage.set(`${err}`);

          return of({});
        }),
      ),
  );
}
