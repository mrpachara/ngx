import { JsonPipe, KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  resource,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  deserializeJose,
  injectAccessTokenService,
  injectAuthorizationCodeService,
  injectIdTokenExtractor,
  isJwt,
  JwkDispatcher,
} from '@mrpachara/ngx-oauth2-access-token';
import { demoOauth, params, scopes } from '../../app.config';

function extractErrorMessage(error: Error | undefined): string | null {
  if (error) {
    console.error(error);

    if (typeof error.stack === 'string') {
      const [message] = error.stack.split('\n', 1);
      return message;
    } else {
      return `${error}`;
    }
  }

  return null;
}

@Component({
  selector: 'app-home',
  imports: [JsonPipe, KeyValuePipe],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly accessTokenService = injectAccessTokenService(demoOauth);
  private readonly authorizationCodeService =
    injectAuthorizationCodeService(demoOauth);
  private readonly idTokenExtractor = injectIdTokenExtractor(demoOauth);

  // private readonly idTokenService = inject(IdTokenService);
  private readonly jwkDispatcher = inject(JwkDispatcher);

  protected readonly ready = computed(() => this.accessTokenService.ready());

  // AccessToken
  protected readonly accessTokenResource = resource({
    loader: async () => await this.accessTokenService.loadAccessTokenInfo(),
  });

  protected readonly errorAccessTokenMessage = computed(() =>
    extractErrorMessage(this.accessTokenResource.error()),
  );

  protected readonly accessTokenJoseResource = resource({
    params: () =>
      this.accessTokenResource.hasValue()
        ? this.accessTokenResource.value()
        : undefined,
    loader: async ({ params }) => deserializeJose(params.token),
  });

  protected readonly errorAccessTokenJoseMessage = computed(() =>
    extractErrorMessage(this.accessTokenJoseResource.error()),
  );

  protected readonly accessTokenJoseVerificationResource = resource({
    params: () =>
      this.accessTokenJoseResource.hasValue()
        ? this.accessTokenJoseResource.value()
        : undefined,
    loader: async ({ params }) => {
      if (isJwt(params, 'JWS')) {
        return await this.jwkDispatcher.verify(params);
      }

      throw new Error('Is not JWS');
    },
  });

  // ID Token
  protected readonly idTokenJoseResource = resource({
    loader: async () => await this.idTokenExtractor.loadInfo(),
  });

  protected readonly idTokenJoseVerificationResource = resource({
    params: () =>
      this.idTokenJoseResource.hasValue()
        ? this.idTokenJoseResource.value()
        : undefined,
    loader: async ({ params }) => await this.jwkDispatcher.verify(params),
  });

  protected readonly errorIdTokenJoseMessage = computed(() =>
    extractErrorMessage(this.idTokenJoseVerificationResource.error()),
  );

  // protected readonly errorIdTokenMessage = computed(() =>
  //   extractErrorMessage(this.accessTokenJoseResource.error()),
  // );

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
