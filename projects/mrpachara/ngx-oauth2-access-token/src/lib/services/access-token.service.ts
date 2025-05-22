import { inject, Injectable, signal } from '@angular/core';
import {
  AccessTokenNotFoundError,
  RefreshTokenExpiredError,
  RefreshTokenNotFoundError,
} from '../errors';
import { validateAndTransformScopes } from '../helpers';
import { libPrefix } from '../predefined';
import { ACCESS_TOKEN_CONFIG, ACCESS_TOKEN_STORAGE } from '../tokens';
import {
  AccessTokenConfigWithId,
  AccessTokenInfo,
  AccessTokenMessage,
  AdditionalParams,
  AuthorizationCodeGrantAccessTokenRequest,
  ClientGrantAccessTokenRequest,
  ExtensionGrantAccessTokenRequest,
  ExtensionWithDataGrant,
  ExtensionWithoutDataGrant,
  PasswordGrantAccessTokenRequest,
  PickOptional,
  RefreshTokenGrantAccessTokenRequest,
  Scopes,
  StandardGrantsAccesTokenRequest,
} from '../types';
import { Oauth2Client } from './oauth2.client';

/** Default access token configuration */
const defaultAccessTokenConfig: PickOptional<AccessTokenConfigWithId> = {
  /** `600_000` miliseconds (10 minutes) */
  accessTokenTtl: 600_000,

  /** `2_592_000_000` miliseconds (30 days) */
  refreshTokenTtl: 2_592_000_000,
} as const;

const existingNameSet = new Set<string>();

function configure(config: AccessTokenConfigWithId) {
  if (typeof config.id.description === 'undefined') {
    throw new Error(`access-token service id MUST has description`);
  }

  if (existingNameSet.has(config.id.description)) {
    throw new Error(
      `Non-unique access-token service id description '${config.id.description}'`,
    );
  }

  existingNameSet.add(config.id.description);

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
    return this.config.id;
  }

  get name() {
    return this.config.id.description!;
  }

  get clientId() {
    return this.client.clientId;
  }

  readonly #ready = signal<boolean | undefined>(undefined);
  readonly ready = this.#ready.asReadonly();

  readonly #lastUpdated = signal<number | undefined>(undefined);
  readonly lastUpdated = this.#lastUpdated.asReadonly();

  readonly #uuid = crypto.randomUUID();

  readonly #bc: BroadcastChannel;

  #post(
    type: AccessTokenMessage['type'],
    timestamp: number,
    ready: boolean,
    to?: AccessTokenMessage['to'],
  ): void {
    this.#bc.postMessage({
      type,
      timestamp: timestamp,
      from: this.#uuid,
      ...(to ? { to } : {}),
      ready,
    } satisfies AccessTokenMessage);
  }

  private readonly extractors?: readonly unknown[];

  constructor() {
    this.#bc = new BroadcastChannel(`${libPrefix}-access-token-${this.name}`);

    this.#bc.addEventListener(
      'message',
      (ev: MessageEvent<AccessTokenMessage>) => {
        const message = ev.data;

        if (typeof message.to !== 'undefined' && message.to !== this.#uuid) {
          return;
        }

        switch (message.type) {
          case 'external-storing':
            this.#ready.set(message.ready);
            this.#lastUpdated.set(message.timestamp);

            return;
          default:
            console.warn(
              `Broadcast '${this.#bc.name}' does not implement '${(message as { type: string }).type}.'`,
            );
        }
      },
    );
  }

  #currentLoad: Promise<AccessTokenInfo> | undefined;

  /** NOTE: this method **MUST** be called from `loadAccessToken()` only. */
  async #tryLoad(
    projector: () => Promise<AccessTokenInfo>,
  ): Promise<AccessTokenInfo> {
    return await (this.#currentLoad ??
      (this.#currentLoad = (async () => {
        await this.storage.lock();

        try {
          const result = await projector();

          this.#ready.set(true);

          return result;
        } catch (err) {
          this.#ready.set(false);

          throw err;
        } finally {
          await this.storage.release();
          this.#currentLoad = undefined;
        }
      })()));
  }

  /**
   * Try to laod access token information from storage:
   *
   * 1. If not found or expired then try to get the new one from _refresh token_.
   * 2. If failed then try to get from `fetchNewAccessToken`.
   * 3. If failed then throw `AccessTokenNotFoundError`.
   *
   * **NOTE:** If want to wait for a `externalStoring` forever, put the logic in
   * `fetchNewAccessToken`.
   *
   * @throws AccessTokenNotFoundError
   */
  async loadAccessToken(): Promise<AccessTokenInfo> {
    return await this.#tryLoad(async () => {
      while (true) {
        const storedAccessToken = await this.storage.load('access');

        if (storedAccessToken && storedAccessToken.expiresAt > Date.now()) {
          return {
            type: storedAccessToken.data.token_type,
            token: storedAccessToken.data.access_token,
          } as const;
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

  #changeReadyByStorage(ready: boolean): void {
    const now = Date.now();

    this.#ready.set(ready);
    this.#lastUpdated.set(now);

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
    type: StandardGrantsAccesTokenRequest['grant_type'],
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

    const accessToken = await this.client.fetchAccessToken(request, { params });

    const now = Date.now();
    if (accessToken.refresh_token) {
      await this.storage.store('refresh', {
        expiresAt: now + this.config.refreshTokenTtl - networkLatencyTime,
        data: accessToken.refresh_token,
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
        (typeof accessToken.expires_in === 'undefined' ||
        accessToken.expires_in === null
          ? this.config.accessTokenTtl
          : accessToken.expires_in * 1_000) -
        networkLatencyTime,
      data: accessToken,
    });

    return this.#changeReadyByStorage(true);
  }

  /**
   * Clear acccess token and refresh token storage.
   *
   * @returns
   */
  async clearTokens(): Promise<void> {
    await this.storage.clear();

    return this.#changeReadyByStorage(false);
  }
}
