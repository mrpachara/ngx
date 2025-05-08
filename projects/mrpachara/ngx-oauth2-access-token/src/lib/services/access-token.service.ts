import { configAccessToken } from '../helpers';
import { AccessTokenStorage } from '../storage';
import {
  AccessTokenConfig,
  AccessTokenFullConfig,
  AccessTokenInfo,
  StandardGrantsAccesTokenRequest,
} from '../types';
import { Oauth2Client } from './oauth2.client';

/**
 * Access token service.
 *
 * **Note:** provided by factory pattern.
 */
export class AccessTokenService {
  private readonly config: AccessTokenFullConfig;

  get name() {
    return this.client.name;
  }

  constructor(
    config: AccessTokenConfig,
    private readonly client: Oauth2Client,
    private readonly storage: AccessTokenStorage,
  ) {
    this.config = configAccessToken(config);
  }

  async loadAccessToken(): Promise<AccessTokenInfo | null> {
    const now = Date.now();

    const data = await this.storage.loadAccessTokenResponse();

    if (data.expiresAt > now) {
      return {
        type: data.response.token_type,
        token: data.response.access_token,
      } as const;
    }

    throw 'unimplemented';
  }

  async fetchAccessToken(
    request: StandardGrantsAccesTokenRequest,
  ): Promise<void> {
    await this.client.fetchAccessToken(request);
  }
}
