import {
  APP_ID,
  DestroyRef,
  inject,
  Injectable,
  linkedSignal,
  resource,
  ResourceStreamItem,
  signal,
} from '@angular/core';
import {
  AccessTokenResponse,
  AuthorizationCodeGrantAccessTokenRequest,
  ClientGrantAccessTokenRequest,
  ExtensionGrantAccessTokenRequest,
  ExtensionWithDataGrant,
  ExtensionWithoutDataGrant,
  PasswordGrantAccessTokenRequest,
  RefreshTokenGrantAccessTokenRequest,
  StandardGrantType,
} from '@mrpachara/ngx-oauth2-access-token/standard';
import { PickOptionalExcept } from '@mrpachara/ngx-oauth2-access-token/utility';
import {
  AccessTokenNotFoundError,
  RefreshTokenExpiredError,
  RefreshTokenNotFoundError,
} from '../errors';
import { validateAndTransformScopes } from '../helpers';
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
  AdditionalParams,
  Oauth2ClientCredentials,
  removedData,
  Scopes,
  storedData,
} from '../types';
import { Oauth2Client } from './oauth2.client';

/** Default access token configuration */
const defaultConfiguration: PickOptionalExcept<
  AccessTokenConfig,
  'clientSecret'
> = {
  clientCredentialsInParams: false,

  /** `600_000` miliseconds (10 minutes) */
  accessTokenTtl: 600_000,

  /** `2_592_000_000` miliseconds (30 days) */
  refreshTokenTtl: 2_592_000_000,
} as const;

function configure(config: AccessTokenConfig) {
  return {
    ...defaultConfiguration,
    ...config,
  } as const;
}

/** Network latency time in units of **miliseconds** */
const networkLatencyTime = 10_000;

Injectable({
  providedIn: 'root',
});
export class AccessTokenService {
  private readonly config = configure(inject(ACCESS_TOKEN_CONFIG));

  private readonly storage = inject(ACCESS_TOKEN_STORAGE);

  private readonly client = inject(Oauth2Client);

  get id() {
    return this.config.id;
  }

  get clientId() {
    return this.config.clientId;
  }

  private readonly clientCredentials = {
    id: this.config.clientId,
    ...(this.config.clientSecret ? { secret: this.config.clientSecret } : {}),
  } as const satisfies Oauth2ClientCredentials;

  private readonly extractors = inject(ACCESS_TOKEN_RESPONSE_EXTRACTORS);

  readonly #version = signal<number | undefined>(undefined);

  #initializeVersion<T>(value: T): T {
    this.#version.update((version) =>
      typeof version === 'undefined' ? 0 : version,
    );

    return value;
  }

  #updateVersion(value: number): void {
    this.#version.update((version) =>
      typeof version === 'undefined' || value > version ? value : version,
    );
  }

  readonly #prefix = `${inject(APP_ID)}-${libPrefix}-access-token`;

  readonly #bc = new BroadcastChannel(`${this.#prefix}-bc:${this.id}`);

  #post(type: AccessTokenMessage['type'], timestamp: number): void {
    this.#bc.postMessage({
      type,
      timestamp: timestamp,
    } satisfies AccessTokenMessage);
  }

  readonly #syncName = `${this.#prefix}-sync:${this.id}`;

  constructor() {
    const ac = new AbortController();

    this.#bc.addEventListener(
      'message',
      async (ev: MessageEvent<AccessTokenMessage>) => {
        const { data: message } = ev;

        switch (message.type) {
          case 'external-store': {
            Promise.allSettled(
              this.extractors.map((extractor) =>
                extractor.update(this.id, {
                  timestamp: message.timestamp,
                  accessTokenResponse: storedData,
                }),
              ),
            );

            return this.#updateVersion(message.timestamp);
          }

          default:
            console.warn(
              `Broadcast '${this.#bc.name}' does not implement '${(message as { type: string }).type}'.`,
            );
        }
      },
      { signal: ac.signal },
    );

    inject(DestroyRef).onDestroy(() => ac.abort());
  }

  async #updatedByStorage(
    accessTokenResponse: AccessTokenResponse | typeof removedData,
  ): Promise<void> {
    const now = Date.now();

    // NOTE: `await` is **required** to make sure that
    //       storage is updated before sub-sequence events.
    await Promise.allSettled(
      this.extractors.map((extractor) =>
        extractor.update(this.id, {
          timestamp: now,
          accessTokenResponse,
        }),
      ),
    );

    this.#updateVersion(now);
    this.#post('external-store', now);
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

          if (storageRefreshToken === null) {
            throw new RefreshTokenNotFoundError(this.id);
          }

          if (storageRefreshToken.expiresAt <= Date.now()) {
            throw new RefreshTokenExpiredError(this.id);
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

    const accessTokenResponse = await this.client.fetchAccessToken(
      this.config.accessTokenUrl,
      this.clientCredentials,
      request,
      {
        params,
        credentialsInParams: this.config.clientCredentialsInParams,
      },
    );

    const now = Date.now();
    if (accessTokenResponse.refresh_token) {
      await this.storage.store('refresh', {
        expiresAt: now + this.config.refreshTokenTtl - networkLatencyTime,
        data: accessTokenResponse.refresh_token,
      });
    } else {
      // NOTE: extends _refresh token_ TTL.
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

    return await this.#updatedByStorage(accessTokenResponse);
  }

  /**
   * Try to laod access token response from storage:
   *
   * 1. If not found or expired then try to get the new one from _refresh token_.
   * 2. If failed then try to get from `fetchNewAccessToken`.
   * 3. If failed then return `null`.
   */
  async loadAccessTokenResponse(): Promise<AccessTokenResponse | null> {
    return await navigator.locks.request(this.#syncName, async () => {
      while (true) {
        const storedAccessToken = await this.storage.load('access');

        if (storedAccessToken && storedAccessToken.expiresAt > Date.now()) {
          return this.#initializeVersion(storedAccessToken.data);
        }

        const storedRefreshToken = await this.storage.load('refresh');

        if (storedRefreshToken && storedRefreshToken.expiresAt > Date.now()) {
          try {
            await this.fetch('refresh_token');

            continue;
          } catch (err) {
            console.warn(err);
          }
        }

        return this.#initializeVersion(null);
      }
    });
  }

  /**
   * Try to load access token info from storage
   *
   * @see {@link loadAccessTokenResponse}
   */
  async loadAccessTokenInfo(): Promise<AccessTokenInfo | null> {
    const accessTokenResponse = await this.loadAccessTokenResponse();

    return accessTokenResponse === null
      ? null
      : {
          type: accessTokenResponse.token_type,
          token: accessTokenResponse.access_token,
        };
  }

  /**
   * Clear acccess token and refresh token storage.
   *
   * @returns
   */
  async clearTokens(): Promise<void> {
    await this.storage.clear();

    return await this.#updatedByStorage(removedData);
  }

  readonly #accessTokenResponseResource = resource({
    params: this.#version,
    loader: async () => await this.loadAccessTokenResponse(),
  });

  /**
   * Create AccessTokenResponse _resource_.
   *
   * @returns
   */
  responseResource() {
    return resource({
      stream: async () => {
        const initializedValue = await this.loadAccessTokenResponse();

        return linkedSignal({
          source: this.#accessTokenResponseResource.snapshot,
          computation: (
            source,
            previous,
          ): ResourceStreamItem<AccessTokenResponse> => {
            return source.status === 'error'
              ? { error: source.error }
              : typeof source.value !== 'undefined'
                ? source.value !== null
                  ? { value: source.value }
                  : { error: new AccessTokenNotFoundError(this.id) }
                : typeof previous !== 'undefined'
                  ? previous.value
                  : initializedValue !== null
                    ? { value: initializedValue }
                    : { error: new AccessTokenNotFoundError(this.id) };
          },
        });
      },
    }).asReadonly();
  }
}
