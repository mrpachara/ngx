import { JsonPipe, KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
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

  private readonly jwkDispatcher = inject(JwkDispatcher);

  // AccessToken
  protected accessTokenResource =
    this.accessTokenService.accessTokenResponseResource();

  protected readonly errorAccessTokenMessage = computed(() =>
    extractErrorMessage(this.accessTokenResource.error()),
  );

  protected readonly accessTokenJoseResource = resource({
    params: () =>
      this.accessTokenResource.hasValue()
        ? this.accessTokenResource.value()
        : undefined,
    loader: async ({ params }) => deserializeJose(params.access_token),
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
  protected readonly idTokenJoseResource = this.idTokenExtractor.infoResource();

  protected readonly idTokenClaimsResource =
    this.idTokenExtractor.claimsResource();

  protected readonly idTokenJoseVerificationResource = resource({
    params: () =>
      this.idTokenJoseResource.hasValue()
        ? this.idTokenJoseResource.value()
        : undefined,
    loader: async ({ params }) => await this.jwkDispatcher.verify(params),
  });

  protected readonly errorIdTokenJoseMessage = computed(() =>
    extractErrorMessage(this.idTokenJoseResource.error()),
  );

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
