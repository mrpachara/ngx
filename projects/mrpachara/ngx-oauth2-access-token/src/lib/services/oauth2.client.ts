import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  AccessTokenRequest,
  AccessTokenResponse,
  Oauth2ErrorResponse,
} from '@mrpachara/ngx-oauth2-access-token/standard';
import {
  isError,
  takeUntilAbortSignal,
} from '@mrpachara/ngx-oauth2-access-token/utility';
import { catchError, firstValueFrom, pipe, throwError } from 'rxjs';
import { Oauth2ClientResponseError } from '../errors';
import { assignRequestData } from '../helpers';
import { OAT_REQUEST } from '../tokens';
import { AdditionalParams, Oauth2ClientCredentials } from '../types';

@Injectable({
  providedIn: 'root',
})
export class Oauth2Client {
  private readonly http = inject(HttpClient);

  private generateHeaderAndBody(
    credentials: Oauth2ClientCredentials,
    request: AccessTokenRequest,
    { params = {} as AdditionalParams, credentialsInParams = false } = {},
  ) {
    const formData = new FormData();

    if (credentialsInParams) {
      return {
        headers: undefined,
        body: assignRequestData(
          formData,
          {
            ...request,
            client_id: credentials.id,
            ...(credentials.secret
              ? {
                  client_secret: credentials.secret,
                }
              : {}),
          },
          { params },
        ),
      };
    } else {
      const authData = btoa(`${credentials.id}:${credentials.secret ?? ''}`);

      return {
        headers: {
          Authorization: `Basic ${authData}` as const,
        },
        body: assignRequestData(formData, request, { params }),
      };
    }
  }

  /**
   * Fetch a new _access token_. The method **DOES NOT** store the new access
   * token. The new _access token_ **MUST** be stored manually.
   *
   * @param url The _access token_ URL
   * @param request The requesting parameters
   * @returns The `Promise` of access token response
   */
  async fetchAccessToken<RES extends AccessTokenResponse = AccessTokenResponse>(
    url: string,
    credentials: Oauth2ClientCredentials,
    request: AccessTokenRequest,
    {
      params = {} as AdditionalParams,
      credentialsInParams = false,
      signal = undefined as AbortSignal | undefined,
    } = {},
  ): Promise<RES> {
    const { headers, body } = this.generateHeaderAndBody(credentials, request, {
      params,
      credentialsInParams,
    });

    return await firstValueFrom(
      this.http
        .post<RES>(url, body, {
          ...(headers ? { headers } : {}),
          context: new HttpContext().set(OAT_REQUEST, true),
        })
        .pipe(
          signal ? takeUntilAbortSignal(signal) : pipe(),
          catchError((error) =>
            throwError(
              () =>
                new Oauth2ClientResponseError(
                  isError<Oauth2ErrorResponse>(error)
                    ? {
                        error: error.error?.error ?? error.name,
                        error_description:
                          error.error?.error_description ?? error.message,
                      }
                    : {
                        error: 'unknown',
                        error_description: `${
                          typeof error === 'object'
                            ? JSON.stringify(error)
                            : error
                        }`,
                      },
                  error,
                ),
            ),
          ),
        ),
    );
  }
}
