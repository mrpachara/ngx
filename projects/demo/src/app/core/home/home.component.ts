import { JsonPipe, KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  resource,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  deserializeJose,
  injectAccessTokenService,
  injectAuthorizationCodeService,
  isJwt,
  JwkDispatcher,
} from '@mrpachara/ngx-oauth2-access-token';
import { demoOauth, params, scopes } from '../../app.config';

@Component({
  selector: 'app-home',
  imports: [JsonPipe, KeyValuePipe],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly accessTokenService = injectAccessTokenService(demoOauth);
  private readonly authorizationCodeService =
    injectAuthorizationCodeService(demoOauth);

  // private readonly idTokenService = inject(IdTokenService);
  private readonly jwkDispatcher = inject(JwkDispatcher);

  protected readonly errorAccessTokenMessage = signal<string | null>(null);
  protected readonly errorAccessTokenJoseMessage = signal<string | null>(null);
  protected readonly errorIdTokenMessage = signal<string | null>(null);

  protected readonly ready = computed(() => this.accessTokenService.ready());

  // AccessToken
  protected readonly accessTokenResource = resource({
    loader: async () => await this.accessTokenService.loadAccessTokenInfo(),
  });

  protected readonly accessTokenJoseResource = resource({
    request: this.accessTokenResource.value,
    loader: async ({ request }) =>
      typeof request === 'undefined'
        ? undefined
        : deserializeJose(request.token),
  });

  protected readonly accessTokenJoseVerificationResource = resource({
    request: this.accessTokenJoseResource.value,
    loader: async ({ request }) =>
      typeof request === 'undefined'
        ? undefined
        : isJwt(request, 'JWS')
          ? await this.jwkDispatcher.verify(request)
          : undefined,
  });

  // protected readonly accessToken = toSignal(
  //   defer(() => this.accessTokenService.loadAccessToken()).pipe(
  //     tap(() => console.debug('get new access token')),
  //     catchError((err) => {
  //       if (typeof err.stack === 'string') {
  //         const [message] = err.stack.split('\n', 1);
  //         this.errorAccessTokenMessage.set(message);
  //       } else {
  //         this.errorAccessTokenMessage.set(`${err}`);
  //       }

  //       return of(undefined);
  //     }),
  //   ),
  // );

  constructor() {
    effect(() => {
      const err = this.accessTokenResource.error() as
        | { stack?: string }
        | undefined;

      if (err) {
        console.error(err);

        if (typeof err.stack === 'string') {
          const [message] = err.stack.split('\n', 1);
          this.errorAccessTokenMessage.set(message);
        } else {
          this.errorAccessTokenMessage.set(`${err}`);
        }
      } else {
        this.errorAccessTokenMessage.set(null);
      }
    });

    effect(() => {
      const err = this.accessTokenJoseResource.error() as
        | { stack?: string }
        | undefined;

      if (err) {
        console.error(err);

        if (typeof err.stack === 'string') {
          const [message] = err.stack.split('\n', 1);
          this.errorAccessTokenJoseMessage.set(message);
        } else {
          this.errorAccessTokenJoseMessage.set(`${err}`);
        }
      } else {
        this.errorAccessTokenJoseMessage.set(null);
      }
    });

    effect(() => {
      if (typeof this.accessTokenService.lastUpdated() !== 'undefined') {
        this.accessTokenResource.reload();
      }
    });
  }

  // private readonly idToken$ = this.accessTokenService
  //   .extract(this.idTokenService, true)
  //   .pipe(
  //     tap(() => console.debug('get new ID token')),
  //     catchError((err) => {
  //       if (typeof err.stack === 'string') {
  //         const [message] = err.stack.split('\n', 1);
  //         this.errorIdTokenMessage.set(message);
  //       } else {
  //         this.errorIdTokenMessage.set(`${err}`);
  //       }
  //       return of(undefined);
  //     }),
  //     share(),
  //   );

  // NOTE: Unlike async pipe ( | async), toSignal() subscribes observable here.
  //       So the result could be evaluated before it is ready.
  // protected readonly idToken = toSignal(this.idToken$);

  // protected readonly idTokenVerified = toSignal(
  //   this.idToken$.pipe(
  //     filter(
  //       (idToken): idToken is IdTokenInfo => typeof idToken !== 'undefined',
  //     ),
  //     switchMap(async (idToken) => this.jwkServiceResolver.verify(idToken)),
  //   ),
  // );

  async renewAccessToken(): Promise<void> {
    await this.accessTokenService.fetch('refresh_token');
  }

  async clearAccessToken(): Promise<void> {
    await this.accessTokenService.clearTokens();
  }

  private readonly router = inject(Router);

  protected async authorization(): Promise<void> {
    const url = await this.authorizationCodeService.generateUrl(
      scopes,
      {
        intendedUrl: this.router.url,
      },
      { params },
    );

    location.href = url.toString();
  }
}
