import {
  APP_ID,
  DestroyRef,
  inject,
  Injectable,
  linkedSignal,
  Resource,
  resource,
  resourceFromSnapshots,
  ResourceSnapshot,
  signal,
  untracked,
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

/** Default _access token_ TTL, `1_800` seconds (30 minutes) */
const defaultAccessTokenTtl = 1_800;

/** Default _refresh token_ TTL, `2_592_000` seconds (30 days) */
const defaultRefreshTokenTtl = 2_592_000;

/** Network latency time in units of **milliseconds** */
const networkLatencyTime = 10_000;

/** Default access token configuration */
const defaultConfiguration: PickOptionalExcept<
  AccessTokenConfig,
  'clientSecret'
> = {
  clientCredentialsInParams: false,
  accessTokenTtl: defaultAccessTokenTtl,
  refreshTokenTtl: defaultRefreshTokenTtl,
} as const;

function configure(config: AccessTokenConfig) {
  return {
    ...defaultConfiguration,
    ...config,
  } as const;
}

/**
 * Extract _access token_ TTL from `AccessTokenResponse` in units of
 * **milliseconds**.
 *
 * @param accessTokenResponse
 * @param config
 * @returns
 */
function extractAccessTokenTtl(
  accessTokenResponse: AccessTokenResponse,
  config: ReturnType<typeof configure>,
): number {
  return (
    (typeof accessTokenResponse.expires_in === 'number'
      ? accessTokenResponse.expires_in
      : config.accessTokenTtl) * 1_000
  );
}

/**
 * Extract _refresh token_ TTL from `AccessTokenResponse` in units of
 * **milliseconds**.
 *
 * @param accessTokenResponse
 * @param config
 * @returns
 */
function extractRefreshTokenTtl(
  accessTokenResponse: AccessTokenResponse,
  config: ReturnType<typeof configure>,
): number {
  if (typeof config.refreshTokenTtl === 'number') {
    return config.refreshTokenTtl * 1_000;
  }

  const claimValue = (
    accessTokenResponse as AccessTokenResponse & {
      readonly [config.refreshTokenTtl]?: number;
    }
  )[config.refreshTokenTtl];

  if (typeof claimValue === 'number') {
    return claimValue * 1_000;
  }

  console.warn(
    `The claim '${config.refreshTokenTtl}' is expected to be a number but got a value with type '${typeof claimValue}'. Use the default refresh token TTL instead.`,
  );

  return defaultRefreshTokenTtl * 1_000;
}

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
        expiresAt:
          now +
          (extractAccessTokenTtl(accessTokenResponse, this.config) -
            networkLatencyTime),
        data: accessTokenResponse.refresh_token,
      });
    }

    await this.storage.store('access', {
      expiresAt:
        now +
        (extractRefreshTokenTtl(accessTokenResponse, this.config) -
          networkLatencyTime),
      data: accessTokenResponse,
    });

    return await this.#updatedByStorage(accessTokenResponse);
  }

  /**
   * Try to laod _access token_ response from storage:
   *
   * 1. If _access token_ was **not found** or **expired** then try to get the new
   *    one from _refresh token_.
   * 2. If getting by _refresh token_ **failed** then return `null`.
   */
  async loadAccessTokenResponse(): Promise<AccessTokenResponse | null> {
    return await navigator.locks.request(this.#syncName, async () => {
      let isTriedToRefresh = false;

      while (true) {
        const storedAccessToken = await this.storage.load('access');

        if (storedAccessToken && storedAccessToken.expiresAt > Date.now()) {
          return this.#initializeVersion(storedAccessToken.data);
        }

        try {
          if (isTriedToRefresh) {
            throw new Error(
              `Getting refresh token is successful but the new access token is invalid.`,
            );
          }

          isTriedToRefresh = true;
          await this.fetch('refresh_token');

          continue;
        } catch (err) {
          console.warn(err);
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
   * It triggers **_eager_** loading of _access token_ response if it is
   * uninitialized and updates whenever the _access token_ response is updated.
   * It also provides the current value of _access token_ response **without**
   * failing to `loading` _state_ if it is already available in snapshots.
   *
   * @returns
   */
  responseResource(): Resource<AccessTokenResponse | undefined> {
    if (typeof untracked(this.#version) === 'undefined') {
      this.loadAccessTokenResponse();
    }

    return resourceFromSnapshots(
      linkedSignal({
        source: this.#accessTokenResponseResource.snapshot,
        computation: (
          source,
          previous,
        ): ResourceSnapshot<AccessTokenResponse | undefined> => {
          if (source.status === 'error') {
            return source;
          } else {
            if (typeof source.value === 'undefined') {
              return typeof previous?.value !== 'undefined'
                ? previous.value
                : {
                    status: source.status,
                    value: source.value,
                  };
            } else {
              return source.value === null
                ? {
                    status: 'error',
                    error: new AccessTokenNotFoundError(this.id),
                  }
                : {
                    status: 'resolved',
                    value: source.value,
                  };
            }
          }
        },
      }),
    );
  }
}
