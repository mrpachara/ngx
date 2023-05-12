import {
  HttpClient,
  HttpContext,
  HttpErrorResponse,
} from '@angular/common/http';
import { Inject, Injectable, inject } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

import {
  OAUTH2_CLIENT_CONFIG,
  OAUTH2_CLIENT_ERROR_TRANSFORMER,
  SKIP_ASSIGNING_ACCESS_TOKEN,
} from './tokens';
import {
  AccessToken,
  Oauth2ClientConfig,
  Oauth2ClientErrorTransformer,
  PickOptional,
  RequiredExcept,
  StandardGrantsParams,
} from './types';
import { Oauth2ClientResponseError } from './errors';

const defaultConfig: PickOptional<Omit<Oauth2ClientConfig, 'clientSecret'>> = {
  debug: false,
  clientCredentialsInParams: false,
};

@Injectable({ providedIn: 'root' })
export class Oauth2Client {
  private readonly http = inject(HttpClient);

  private readonly config: RequiredExcept<Oauth2ClientConfig, 'clientSecret'>;

  constructor(
    @Inject(OAUTH2_CLIENT_CONFIG) config: Oauth2ClientConfig,
    @Inject(OAUTH2_CLIENT_ERROR_TRANSFORMER)
    private readonly errorTransformer: Oauth2ClientErrorTransformer,
  ) {
    this.config = {
      ...defaultConfig,
      ...config,
    };
  }

  private generateClientHeaderIfNeeded():
    | { Authorization: string }
    | undefined {
    if (this.config.clientCredentialsInParams) {
      return undefined;
    }

    const authData = btoa(
      `${this.config.clientId}:${this.config.clientSecret ?? ''}`,
    );

    return {
      Authorization: `Basic ${authData}`,
    };
  }

  private generateClientParamIfNeeded(withSecret = false):
    | {
        client_id: string;
        client_secret?: string;
      }
    | undefined {
    if (!this.config.clientCredentialsInParams) {
      return undefined;
    }

    return this.generateClientParams(withSecret);
  }

  private generateClientParams<T extends boolean>(
    withSecret: T,
  ): true extends T
    ? {
        client_id: string;
        client_secret?: string;
      }
    : { client_id: string } {
    return {
      client_id: this.config.clientId,
      ...(withSecret && this.config.clientSecret
        ? { client_secret: this.config.clientSecret }
        : {}),
    };
  }

  requestAccessToken<T extends StandardGrantsParams>(
    params: T,
  ): Observable<AccessToken> {
    return this.http
      .post<AccessToken>(
        this.config.accessTokenUrl,
        {
          ...params,
          ...this.generateClientParamIfNeeded(true),
        },
        {
          context: new HttpContext().set(SKIP_ASSIGNING_ACCESS_TOKEN, true),
          headers: {
            ...this.generateClientHeaderIfNeeded(),
          },
        },
      )
      .pipe(
        catchError((err: unknown) => {
          if (err instanceof HttpErrorResponse) {
            return throwError(
              () =>
                new Oauth2ClientResponseError(this.errorTransformer(err), {
                  cause: err,
                }),
            );
          }

          return throwError(() => err);
        }),
      );
  }

  getClientParams(): { client_id: string } {
    return this.generateClientParams(false);
  }
}
