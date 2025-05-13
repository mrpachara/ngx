import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { configOauth2Client, takeUntilAbortignal } from '../helpers';
import {
  AccessTokenResponse,
  Oauth2ClientConfig,
  Oauth2ClientFullConfig,
  StandardGrantsAccesTokenRequest,
} from '../types';

/**
 * OAuth 2.0 client.
 *
 * **Note:** provided by factory pattern.
 */
export class Oauth2Client {
  private readonly config: Oauth2ClientFullConfig;

  private readonly http = inject(HttpClient);

  /** The name of Oauth2Client */
  get name() {
    return this.config.name;
  }

  /** The client id of Oauth2Cient */
  get clientId() {
    return this.config.clientId;
  }

  constructor(config: Oauth2ClientConfig) {
    this.config = configOauth2Client(config);
  }

  private generateHeaderAndBody(request: StandardGrantsAccesTokenRequest) {
    if (this.config.clientCredentialsInParams) {
      return {
        headers: undefined,
        body: {
          ...request,
          client_id: this.config.clientId,
          ...(this.config.clientSecret
            ? {
                client_secret: this.config.clientSecret,
              }
            : {}),
        },
      };
    } else {
      const authData = btoa(
        `${this.config.clientId}:${this.config.clientSecret ?? ''}`,
      );

      return {
        headers: {
          Authorization: `Basic ${authData}` as const,
        },
        body: { ...request },
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
    request: StandardGrantsAccesTokenRequest,
    signal?: AbortSignal,
  ): Promise<RES> {
    const { headers, body } = this.generateHeaderAndBody(request);

    return firstValueFrom(
      this.http
        .post<RES>(this.config.accessTokenUrl, body, {
          headers: headers,
        })
        .pipe(takeUntilAbortignal(signal)),
    );
  }
}
