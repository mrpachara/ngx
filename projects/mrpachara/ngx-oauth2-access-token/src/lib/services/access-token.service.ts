import { APP_ID, inject, Injectable, resource, signal } from '@angular/core';
import {
  AccessTokenNotFoundError,
  RefreshTokenExpiredError,
  RefreshTokenNotFoundError,
} from '../errors';
import { flatStreamResource, validateAndTransformScopes } from '../helpers';
import { libPrefix } from '../predefined';
import {
  ACCESS_TOKEN_CONFIG,
  ACCESS_TOKEN_RESPONSE_EXTRACTORS,
  ACCESS_TOKEN_STORAGE,
} from '../tokens';
import {
  AccessTokenConfig,
  AccessTokenInfo,
  AccessTokenMessage,
  AccessTokenResponse,
  AccessTokenResponseUpdatedData,
  AdditionalParams,
  AuthorizationCodeGrantAccessTokenRequest,
  ClientGrantAccessTokenRequest,
  ExtensionGrantAccessTokenRequest,
  ExtensionWithDataGrant,
  ExtensionWithoutDataGrant,
  PasswordGrantAccessTokenRequest,
  PickOptional,
  RefreshTokenGrantAccessTokenRequest,
  removedData,
  Scopes,
  StandardGrantType,
  storedData,
} from '../types';
import { Oauth2Client } from './oauth2.client';

/** Default access token configuration */
const defaultAccessTokenConfig: PickOptional<AccessTokenConfig> = {
  /** `600_000` miliseconds (10 minutes) */
  accessTokenTtl: 600_000,

  /** `2_592_000_000` miliseconds (30 days) */
  refreshTokenTtl: 2_592_000_000,
} as const;

function configure(config: AccessTokenConfig) {
  return {
    ...defaultAccessTokenConfig,
    ...config,
  } as const;
}

/** Network latency time in units of **miliseconds** */
const networkLatencyTime = 10_000;

Injectable();
export class AccessTokenService {
  private readonly config = configure(inject(ACCESS_TOKEN_CONFIG));

  private readonly client = inject(Oauth2Client);

  private readonly storage = inject(ACCESS_TOKEN_STORAGE);

  get id() {
    return this.client.id;
  }

  get name() {
    return this.client.name;
  }

  get clientId() {
    return this.client.clientId;
  }

  private readonly extractors = [
    ...(inject(ACCESS_TOKEN_RESPONSE_EXTRACTORS, {
      optional: true,
    }) ?? []),
  ].map((extractor) => {
    if (extractor.id !== this.id) {
      throw new Error(
        `Extractor '${extractor.id.description ?? '[unknown]'}' mismatches AccessTokenService '${this.name}'.`,
      );
    }

    return extractor;
  });

  readonly #ready = signal<boolean | undefined>(undefined);
  readyResource() {
    return flatStreamResource(
      resource({
        params: () => this.#ready(),
        loader: async ({ params: ready }) => ready,
      }),
    ).asReadonly();
  }

  readonly #lastUpdated = signal<AccessTokenResponseUpdatedData | undefined>(
    undefined,
  );
  accessTokenResponseResource() {
    return flatStreamResource(
      resource({
        params: () => this.#lastUpdated() ?? Date.now(),
        loader: async () => await this.loadAccessTokenResponse(),
      }),
    ).asReadonly();
  }

  readonly #bc: BroadcastChannel;

  #post(
    type: AccessTokenMessage['type'],
    timestamp: number,
    ready: boolean,
  ): void {
    this.#bc.postMessage({
      type,
      timestamp: timestamp,
      ready,
    } satisfies AccessTokenMessage);
  }

  readonly #syncName: string;

  constructor() {
    const prefix = `${inject(APP_ID)}-${libPrefix}-access-token`;

    this.#syncName = `${prefix}-sync:${this.name}`;

    this.#bc = new BroadcastChannel(`${prefix}:${this.name}`);

    this.#bc.addEventListener(
      'message',
      async (ev: MessageEvent<AccessTokenMessage>) => {
        const message = ev.data;

        switch (message.type) {
          case 'external-storing': {
            const lastUpdated = {
              timestamp: message.timestamp,
              accessTokenResponse: storedData,
            } as const;

            Promise.allSettled(
              this.extractors.map((extractor) => extractor.update(lastUpdated)),
            );

            this.#ready.set(message.ready);

            this.#lastUpdated.set(lastUpdated);

            return;
          }

          default:
            console.warn(
              `Broadcast '${this.#bc.name}' does not implement '${(message as { type: string }).type}.'`,
            );
        }
      },
    );
  }

  /** NOTE: this method **MUST** be called from `loadAccessTokenResponse()` only. */
  async #lockedlyLoad(
    projector: () => Promise<AccessTokenResponse>,
  ): Promise<AccessTokenResponse> {
    return await navigator.locks.request(this.#syncName, async () => {
      try {
        const result = await projector();

        this.#ready.set(true);

        return result;
      } catch (err) {
        this.#ready.set(false);

        throw err;
      }
    });
  }

  /**
   * Try to laod access token response from storage:
   *
   * 1. If not found or expired then try to get the new one from _refresh token_.
   * 2. If failed then try to get from `fetchNewAccessToken`.
   * 3. If failed then throw `AccessTokenNotFoundError`.
   *
   * @throws AccessTokenNotFoundError
   */
  async loadAccessTokenResponse(): Promise<AccessTokenResponse> {
    return await this.#lockedlyLoad(async () => {
      while (true) {
        const storedAccessToken = await this.storage.load('access');

        if (storedAccessToken && storedAccessToken.expiresAt > Date.now()) {
          return storedAccessToken.data;
        }

        const storageRefreshToken = await this.storage.load('refresh');

        if (storageRefreshToken && storageRefreshToken.expiresAt > Date.now()) {
          try {
            await this.fetch('refresh_token');

            continue;
          } catch (err) {
            console.warn(err);
          }
        }

        throw new AccessTokenNotFoundError(this.name);
      }
    });
  }

  /**
   * Try to load access token info from storage
   *
   * @throws AccessTokenNotFoundError
   * @see {@link loadAccessTokenResponse}
   */
  async loadAccessTokenInfo(): Promise<AccessTokenInfo> {
    const accessTokenResponse = await this.loadAccessTokenResponse();

    return {
      type: accessTokenResponse.token_type,
      token: accessTokenResponse.access_token,
    } as const;
  }

  #changeReadyByStorage(
    ready: true,
    accessTokenResponse: AccessTokenResponse,
  ): Promise<void>;

  #changeReadyByStorage(ready: false): Promise<void>;

  async #changeReadyByStorage(
    ready: boolean,
    accessTokenResponse: AccessTokenResponse | typeof removedData = removedData,
  ): Promise<void> {
    const now = Date.now();

    const updatedData = {
      timestamp: now,
      accessTokenResponse,
    } as const;

    await Promise.allSettled(
      this.extractors.map((extractor) => extractor.update(updatedData)),
    );

    this.#ready.set(ready);
    this.#lastUpdated.set(updatedData);

    this.#post('external-storing', now, ready);
  }

  /** Fetch access token from _Authorization Code_ grant. Then store to storage. */
  async fetch(
    type: 'authorization_code',
    code: string,
    redirectUri: string,
    opts?: { codeVerifier?: string; params?: AdditionalParams },
  ): Promise<void>;

  /**
   * Fetch access token from _Resource Owner Password Credentials_ grant. Then
   * store to storage.
   */
  async fetch(
    type: 'password',
    username: string,
    password: string,
    opts?: { scopes?: Scopes; params?: AdditionalParams },
  ): Promise<void>;

  /** Fetch access token from _Client Credentials_ grant. Then store to storage. */
  async fetch(
    type: 'client_credentials',
    opts?: { scopes?: Scopes; params?: AdditionalParams },
  ): Promise<void>;

  /**
   * Fetch access token from _Extension_ without data grants. Then store to
   * storage.
   */
  async fetch<EG extends ExtensionWithoutDataGrant>(
    type: EG['grantType'],
    opts?: { scopes?: Scopes; params?: AdditionalParams },
  ): Promise<void>;

  /**
   * Fetch access token from _Extension_ with data grants. Then store to
   * storage.
   */
  async fetch<EG extends ExtensionWithDataGrant>(
    type: EG['grantType'],
    opts?: { data: EG['dataType']; scopes?: Scopes; params?: AdditionalParams },
  ): Promise<void>;

  /**
   * Fetch access token from _Refreshing an Access Token_ grant. Then store to
   * storage.
   *
   * @throws RefreshTokenNotFoundError | RefreshTokenExpiredError
   */
  async fetch(
    type: 'refresh_token',
    opts?: { scopes?: Scopes; params?: AdditionalParams },
  ): Promise<void>;

  async fetch<EG extends ExtensionWithoutDataGrant | ExtensionWithDataGrant>(
    type: StandardGrantType,
    ...args: unknown[]
  ): Promise<void> {
    const { request, params } = await (async () => {
      switch (type) {
        case 'authorization_code': {
          const [code, redirectUri, { codeVerifier, params } = {}] = args as [
            string,
            string,
            { codeVerifier?: string; params?: AdditionalParams } | undefined,
          ];

          return {
            request: {
              grant_type: type,
              code,
              redirect_uri: redirectUri,
              ...(typeof codeVerifier === 'undefined'
                ? {}
                : { code_verifier: codeVerifier }),
            } satisfies AuthorizationCodeGrantAccessTokenRequest,
            params,
          } as const;
        }

        case 'password': {
          const [username, password, { scopes, params } = {}] = args as [
            string,
            string,
            { scopes?: Scopes; params?: AdditionalParams } | undefined,
          ];

          return {
            request: {
              grant_type: type,
              username,
              password,
              ...(typeof scopes === 'undefined'
                ? {}
                : { scope: validateAndTransformScopes(scopes) }),
            } satisfies PasswordGrantAccessTokenRequest,
            params,
          } as const;
        }

        case 'client_credentials': {
          const [{ scopes, params } = {}] = args as [
            { scopes?: Scopes; params?: AdditionalParams } | undefined,
          ];

          return {
            request: {
              grant_type: type,
              ...(typeof scopes === 'undefined'
                ? {}
                : { scope: validateAndTransformScopes(scopes) }),
            } satisfies ClientGrantAccessTokenRequest,
            params,
          } as const;
        }

        case 'refresh_token': {
          const [{ scopes, params } = {}] = args as [
            { scopes?: Scopes; params?: AdditionalParams } | undefined,
          ];

          const storageRefreshToken = await this.storage.load('refresh');

          if (typeof storageRefreshToken === 'undefined') {
            throw new RefreshTokenNotFoundError(this.name);
          }

          if (storageRefreshToken.expiresAt <= Date.now()) {
            throw new RefreshTokenExpiredError(this.name);
          }

          return {
            request: {
              grant_type: type,
              refresh_token: storageRefreshToken.data,
              ...(typeof scopes === 'undefined'
                ? {}
                : { scope: validateAndTransformScopes(scopes) }),
            } satisfies RefreshTokenGrantAccessTokenRequest,
            params,
          } as const;
        }

        default: {
          const [{ data = {}, scopes, params } = {}] = args as [
            | {
                data?: EG['dataType'];
                scopes?: Scopes;
                params?: AdditionalParams;
              }
            | undefined,
          ];

          return {
            request: {
              grant_type: type,
              ...data,
              ...(typeof scopes === 'undefined'
                ? {}
                : { scope: validateAndTransformScopes(scopes) }),
            } satisfies ExtensionGrantAccessTokenRequest,
            params,
          } as const;
        }
      }
    })();

    const accessTokenResponse = await this.client.fetchAccessToken(request, {
      params,
    });

    const now = Date.now();
    if (accessTokenResponse.refresh_token) {
      await this.storage.store('refresh', {
        expiresAt: now + this.config.refreshTokenTtl - networkLatencyTime,
        data: accessTokenResponse.refresh_token,
      });
    } else {
      const storedRefreshToken = await this.storage.load('refresh');

      if (storedRefreshToken) {
        await this.storage.store('refresh', {
          expiresAt: now + this.config.refreshTokenTtl - networkLatencyTime,
          data: storedRefreshToken.data,
        });
      }
    }

    await this.storage.store('access', {
      expiresAt:
        now +
        (typeof accessTokenResponse.expires_in === 'undefined' ||
        accessTokenResponse.expires_in === null
          ? this.config.accessTokenTtl
          : accessTokenResponse.expires_in * 1_000) -
        networkLatencyTime,
      data: accessTokenResponse,
    });

    return await this.#changeReadyByStorage(true, accessTokenResponse);
  }

  /**
   * Clear acccess token and refresh token storage.
   *
   * @returns
   */
  async clearTokens(): Promise<void> {
    await this.storage.clear();

    return await this.#changeReadyByStorage(false);
  }
}
