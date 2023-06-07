import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, filter, from, of, share, switchMap } from 'rxjs';

import {
  AccessTokenService,
  IdTokenInfo,
  IdTokenService,
  JwkServiceResolver,
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
  private readonly jwkServiceResolver = inject(JwkServiceResolver);

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

  private readonly idToken$ = from(
    this.accessTokenService.extract(this.idTokenService),
  ).pipe(
    catchError((err) => {
      if (typeof err.stack === 'string') {
        const [message] = err.stack.split('\n', 1);
        this.errorIdTokenMessage.set(message);
      } else {
        this.errorIdTokenMessage.set(`${err}`);
      }
      return of(undefined);
    }),
    share(),
  );

  // NOTE: Unlike async pipe ( | async), toSignal() subscribes observable here.
  //       So the result could be evaluated before it is ready.
  protected readonly idToken = toSignal(this.idToken$);

  protected readonly idTokenVerified = toSignal(
    this.idToken$.pipe(
      filter(
        (idToken): idToken is IdTokenInfo => typeof idToken !== 'undefined',
      ),
      switchMap(async (idToken) =>
        this.jwkServiceResolver
          .findByIssuer(idToken.header.iss ?? idToken.payload.iss ?? '')
          ?.verify(idToken),
      ),
    ),
  );
}
