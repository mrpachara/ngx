import {
  HttpClient,
  HttpContext,
  HttpErrorResponse,
} from '@angular/common/http';
import {
  FactoryProvider,
  Inject,
  Injectable,
  InjectionToken,
} from '@angular/core';
import { catchError, Observable, of, throwError } from 'rxjs';

import { OAUTH2_CLIENT_CONFIG, SKIP_ASSIGNING_ACCESS_TOKEN } from './tokens';
import {
  AccessToken,
  AuthorizationCodeParams,
  Oauth2ClientConfig,
  StandardGrantsParams,
} from './types';

export function createOauth2Client(
  providedToken: InjectionToken<Oauth2Client> | typeof Oauth2Client,
  config: Oauth2ClientConfig,
): FactoryProvider {
  return {
    provide: providedToken,
    useFactory: (httpClient: HttpClient): Oauth2Client =>
      new Oauth2Client(config, httpClient),
    deps: [HttpClient],
  };
}

@Injectable()
export class Oauth2Client {
  constructor(
    @Inject(OAUTH2_CLIENT_CONFIG) private readonly config: Oauth2ClientConfig,
    private readonly http: HttpClient,
  ) {}

  private generateClientHeader(): { Authorization: string } {
    const authData = btoa(
      `${this.config.clientId}:${this.config.clientSecret}`,
    );

    return {
      Authorization: `Basic ${authData}`,
    };
  }

  private generateClientParam(): {
    client_id: string;
    client_secret?: string;
  } {
    return {
      client_id: this.config.clientId,
      ...(this.config.clientSecret
        ? { client_secret: this.config.clientSecret }
        : {}),
    };
  }

  public requestAccessToken<T = StandardGrantsParams>(
    params: T,
  ): Observable<AccessToken> {
    return this.http
      .post<AccessToken>(
        this.config.accessTokenUrl,
        {
          ...params,
          ...(this.config.clientCredentialsInParams
            ? this.generateClientParam()
            : {}),
        },
        {
          context: new HttpContext().set(SKIP_ASSIGNING_ACCESS_TOKEN, true),
          headers: {
            ...(!this.config.clientCredentialsInParams
              ? this.generateClientHeader()
              : {}),
          },
        },
      )
      .pipe(
        catchError((err: unknown) => {
          if (err instanceof HttpErrorResponse && err.error) {
            return throwError(() => err.error);
          }

          return throwError(() => err);
        }),
      );
  }

  public generateAuthorizationCodeUrl<T = AuthorizationCodeParams>(
    params: T,
  ): Observable<URL> {
    const httpParams = new URLSearchParams({
      ...params,
      ...this.generateClientParam(),
    });

    return of(new URL(`${this.config.authorizationCodeUrl}?${httpParams}`));
  }
}
