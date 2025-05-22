import {
  HttpClient,
  HttpContext,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { Oauth2ClientResponseError } from '../errors';
import { assignRequestData, takeUntilAbortignal } from '../helpers';
import {
  OAUTH2_CLIENT_CONFIG,
  OAUTH2_CLIENT_ERROR_TRANSFORMER,
  SKIP_ASSIGNING_ACCESS_TOKEN,
} from '../tokens';
import {
  AccessTokenRequest,
  AccessTokenResponse,
  AdditionalParams,
  Oauth2ClientConfigWithId,
  PickOptionalExcept,
} from '../types';

const defaultOauth2ClientConfig: PickOptionalExcept<
  Oauth2ClientConfigWithId,
  'clientSecret'
> = {
  clientCredentialsInParams: false,
} as const;

const existingNameSet = new Set<string>();

function configure(config: Oauth2ClientConfigWithId) {
  if (typeof config.id.description === 'undefined') {
    throw new Error(`oauth2 client id MUST has description`);
  }

  if (existingNameSet.has(config.id.description)) {
    throw new Error(
      `Non-unique oauth2 client id description '${config.id.description}'`,
    );
  }

  existingNameSet.add(config.id.description);

  return {
    ...defaultOauth2ClientConfig,
    ...config,
  } as const;
}

@Injectable()
export class Oauth2Client {
  private readonly config = configure(inject(OAUTH2_CLIENT_CONFIG));

  private readonly errorTransformer = inject(OAUTH2_CLIENT_ERROR_TRANSFORMER);

  private readonly http = inject(HttpClient);

  get name() {
    return this.config.id.description!;
  }

  /** The client id of Oauth2Cient */
  get clientId() {
    return this.config.clientId;
  }

  private generateHeaderAndBody(
    request: AccessTokenRequest,
    { params = {} as AdditionalParams } = {},
  ) {
    const formData = new FormData();

    if (this.config.clientCredentialsInParams) {
      return {
        headers: undefined,
        body: assignRequestData(
          formData,
          {
            ...request,
            client_id: this.config.clientId,
            ...(typeof this.config.clientSecret === 'undefined'
              ? {}
              : {
                  client_secret: this.config.clientSecret,
                }),
          },
          { params },
        ),
      };
    } else {
      const authData = btoa(
        `${this.config.clientId}:${this.config.clientSecret ?? ''}`,
      );

      return {
        headers: {
          Authorization: `Basic ${authData}` as const,
        },
        body: assignRequestData(formData, request, { params }),
      };
    }
  }

  /**
   * Fetch the new access token. The method **DO NOT** store the new access
   * token. The new access token **MUST** be stored manually.
   *
   * @param request The requesting parameters
   * @returns The `Promise` of access token response
   */
  async fetchAccessToken<RES extends AccessTokenResponse = AccessTokenResponse>(
    request: AccessTokenRequest,
    {
      params = {} as AdditionalParams,
      signal = undefined as AbortSignal | undefined,
    } = {},
  ): Promise<RES> {
    const { headers, body } = this.generateHeaderAndBody(request, { params });

    return await firstValueFrom(
      this.http
        .post<RES>(this.config.accessTokenUrl, body, {
          headers: headers,
          context: new HttpContext().set(SKIP_ASSIGNING_ACCESS_TOKEN, true),
        })
        .pipe(
          takeUntilAbortignal(signal),
          catchError((err) =>
            throwError(
              () =>
                new Oauth2ClientResponseError(
                  this.name,
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
            ),
          ),
        ),
    );
  }
}
