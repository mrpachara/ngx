import {
  HttpClient,
  HttpContext,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { Oauth2ClientResponseError } from '../errors';
import { SKIP_ASSIGNING_ACCESS_TOKEN } from '../tokens';
import {
  AccessTokenResponse,
  Oauth2ClientErrorTransformer,
  Oauth2ClientFullConfig,
  StandardGrantsParams,
} from '../types';

/** OAuth 2.0 client */
export class Oauth2Client {
  private readonly http = inject(HttpClient);

  /** The client name */
  get name() {
    return this.config.name;
  }

  constructor(
    private readonly config: Oauth2ClientFullConfig,
    private readonly errorTransformer: Oauth2ClientErrorTransformer,
  ) {}

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

  /**
   * Request for the new access token. The method **DO NOT** store the new
   * access token. The new access token **MUST** be stored manually.
   *
   * @param params The requesting parameters
   * @returns The `Observable` of access token response
   */
  requestAccessToken<T extends StandardGrantsParams>(
    params: T,
  ): Observable<AccessTokenResponse> {
    return this.http
      .post<AccessTokenResponse>(
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
          return throwError(
            () =>
              new Oauth2ClientResponseError(
                this.config.name,
                err instanceof HttpErrorResponse
                  ? this.errorTransformer(err)
                  : err instanceof Error
                    ? {
                        error: err.name,
                        error_description: err.message,
                      }
                    : {
                        error: 'Unknown',
                        error_description: `${
                          typeof err === 'object' ? JSON.stringify(err) : err
                        }`,
                      },
                {
                  cause: err,
                },
              ),
          );
        }),
      );
  }

  /**
   * Get the client credential parameters. The result always exclude
   * `client_secret`.
   *
   * @returns The client credential paramters excluding `client_secret`
   */
  getClientParams(): { client_id: string } {
    return this.generateClientParams(false);
  }
}
