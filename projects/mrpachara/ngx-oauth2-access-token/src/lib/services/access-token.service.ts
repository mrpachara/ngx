import { signal } from '@angular/core';
import { firstValueFrom, Observable, Subject } from 'rxjs';
import { AccessTokenNotFoundError } from '../errors';
import {
  abortSignalFromObservable,
  configAccessToken,
  sleep,
} from '../helpers';
import { libPrefix } from '../predefined';
import { AccessTokenStorage } from '../storages';
import { injectOauth2Client } from '../tokens';
import {
  AccessTokenConfig,
  AccessTokenFullConfig,
  AccessTokenInfo,
  AccessTokenMessage,
  StandardGrantsAccesTokenRequest,
} from '../types';
import { Oauth2Client } from './oauth2.client';

/** Network latency time in units of **miliseconds** */
const networkLatencyTime = 10_000;

/** Broadcast waiting time in units of **miliseconds** */
const broadcastWaitingTime = 10;

const externalStoringSymbol = Symbol('external-storing');

/**
 * Access token service.
 *
 * **Note:** provided by factory pattern.
 */
export class AccessTokenService {
  private readonly config: AccessTokenFullConfig;

  private readonly client: Oauth2Client;

  get name() {
    return this.config.name;
  }

  readonly #ready = signal<boolean | undefined>(undefined);
  readonly ready = this.#ready.asReadonly();

  readonly #uuid = crypto.randomUUID();

  readonly #broadcastChannel: BroadcastChannel;

  #post(
    type: AccessTokenMessage['type'],
    timestamp: number,
    to?: AccessTokenMessage['to'],
  ): void {
    this.#broadcastChannel.postMessage({
      type,
      uuid: this.#uuid,
      timestamp: timestamp,
      ...(to ? { to } : {}),
    });
  }

  readonly #externalStoring: Observable<typeof externalStoringSymbol>;
  #lockReleased: Promise<void>;
  #lockRequest = Infinity;
  #release: (() => void) | undefined = undefined;

  constructor(
    config: AccessTokenConfig,
    private readonly storage: AccessTokenStorage,
    private readonly fetchNewAccessToken:
      | ((signal: AbortSignal) => Promise<void>)
      | undefined,
    private readonly extractors: readonly unknown[],
  ) {
    this.config = configAccessToken(config);
    this.client = injectOauth2Client(this.config.name);

    this.#broadcastChannel = new BroadcastChannel(
      `${libPrefix}-access-token-${this.client.name}`,
    );

    addEventListener(
      'unload',
      () => {
        this.#release?.();
      },
      { once: true },
    );

    const release$$ = new Subject<void>();
    const externalStoring$$ = new Subject<typeof externalStoringSymbol>();

    this.#externalStoring = externalStoring$$.asObservable();

    this.#broadcastChannel.addEventListener(
      'message',
      (ev: MessageEvent<AccessTokenMessage>) => {
        const message = ev.data;

        if (typeof message.to !== 'undefined' && message.to !== this.#uuid) {
          return;
        }

        switch (message.type) {
          case 'sync':
            if (typeof this.#release !== 'undefined') {
              this.#post('lock', this.#lockRequest, message.uuid);
            }

            return;
          case 'lock':
            if (
              message.timestamp < this.#lockRequest ||
              (message.timestamp === this.#lockRequest &&
                message.uuid < this.#uuid)
            ) {
              this.#lockReleased = firstValueFrom(release$$);
            }

            return;
          case 'release':
            release$$.next();

            return;
          case 'external-storing':
            externalStoring$$.next(externalStoringSymbol);

            this.#ready.set(true);

            return;
          default:
            throw new Error(
              `Broadcast '${this.#broadcastChannel.name}' does not implement '${(message as { type: string }).type}.'`,
            );
        }
      },
    );

    this.#lockReleased = (async () => {
      this.#post('sync', Date.now());
      return await sleep(broadcastWaitingTime);
    })();
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
  readonly loadAccessToken = (() => {
    let currentLoading: Promise<AccessTokenInfo> | null = null;

    /**
     * NOTE: indexedDB transaction is forced to finish when it meets
     * asynchronous process, e.g. `await`. For addressing multiple tabs, use
     * BroadcastChannel instead.
     */
    const lock = async () => {
      this.#lockRequest = Date.now();
      for (
        let currentLockReleased: Promise<void> | null = null;
        currentLockReleased !== this.#lockReleased;

      ) {
        currentLockReleased = this.#lockReleased;
        await currentLockReleased;

        this.#post('lock', this.#lockRequest);
        await sleep(broadcastWaitingTime);
      }

      this.#release = () => {
        this.#post('release', Date.now());
      };
    };

    const release = () => {
      currentLoading = null;

      this.#release?.();
      this.#release = undefined;
      this.#lockRequest = Infinity;
    };

    return async (): Promise<AccessTokenInfo> =>
      await (currentLoading =
        currentLoading ??
        (async () => {
          await lock();

          while (true) {
            const storedAccessToken = await this.storage.loadData('access');

            if (storedAccessToken && storedAccessToken.expiresAt > Date.now()) {
              release();

              this.#ready.set(true);

              return {
                type: storedAccessToken.data.token_type,
                token: storedAccessToken.data.access_token,
              } as const;
            }

            const storageRefreshToken = await this.storage.loadData('refresh');

            if (
              storageRefreshToken &&
              storageRefreshToken.expiresAt > Date.now()
            ) {
              try {
                await this.fetchAccessToken({
                  grant_type: 'refresh_token',
                  refresh_token: storageRefreshToken.data,
                });

                continue;
              } catch (err) {
                console.warn(err);
              }
            }

            const fetchNewAccessToken = this.fetchNewAccessToken;

            if (typeof fetchNewAccessToken !== 'undefined') {
              const { signal, unsubcript } = abortSignalFromObservable(
                this.#externalStoring,
              );

              try {
                await this.fetchNewAccessToken?.(signal);

                continue;
              } catch (err) {
                if (err === externalStoringSymbol) {
                  continue;
                }

                console.warn(err);
              } finally {
                unsubcript();
              }
            }

            release();

            this.#ready.set(false);

            throw new AccessTokenNotFoundError(this.name);
          }
        })());
  })();

  /** Fetch access token from standard flows. Then store to storage. */
  async fetchAccessToken(
    request: StandardGrantsAccesTokenRequest,
  ): Promise<void> {
    const accessToken = await this.client.fetchAccessToken(request);

    const now = Date.now();
    if (accessToken.refresh_token) {
      await this.storage.storeData('refresh', {
        expiresAt: now + this.config.refreshTokenTtl - networkLatencyTime,
        data: accessToken.refresh_token,
      });
    } else {
      const storedRefreshToken = await this.storage.loadData('refresh');

      if (storedRefreshToken) {
        await this.storage.storeData('refresh', {
          expiresAt: now + this.config.refreshTokenTtl - networkLatencyTime,
          data: storedRefreshToken.data,
        });
      }
    }

    await this.storage.storeData('access', {
      expiresAt:
        now +
        (typeof accessToken.expires_in === 'undefined' ||
        accessToken.expires_in === null
          ? this.config.accessTokenTtl
          : accessToken.expires_in * 1_000) -
        networkLatencyTime,
      data: accessToken,
    });

    this.#ready.set(true);

    return void this.#post('external-storing', Date.now());
  }

  /**
   * Clear acccess token and refresh token storage.
   *
   * @returns
   */
  async clearTokens(): Promise<void> {
    await this.storage.clear();

    return this.#ready.set(false);
  }
}
