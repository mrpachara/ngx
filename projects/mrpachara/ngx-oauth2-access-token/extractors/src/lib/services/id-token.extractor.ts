import {
  inject,
  Injectable,
  Injector,
  linkedSignal,
  Resource,
  resource,
  resourceFromSnapshots,
  ResourceRef,
  ResourceSnapshot,
  signal,
  untracked,
  WritableSignal,
} from '@angular/core';
import {
  ACCESS_TOKEN_ID,
  AccessTokenResponseExtractor,
  AccessTokenResponseUpdatedData,
  IdKey,
  removedData,
  storedData,
} from '@mrpachara/ngx-oauth2-access-token';
import {
  AccessTokenResponse,
  deserializeJose,
  IdTokenClaims,
  IdTokenInfo,
  isJwt,
  JwtHeader,
} from '@mrpachara/ngx-oauth2-access-token/standard';
import {
  EncryptedIdTokenError,
  IdTokenClaimsExpiredError,
  IdTokenExpiredError,
  IdTokenInfoNotFoundError,
  InvalidIdTokenPayloadError,
} from '../errors';
import {
  ID_TOKEN_CLAIMS_TRANSFORMER,
  ID_TOKEN_STORAGE,
  ID_TOKEN_VERIFICATION,
} from '../tokens';

interface IdTokenRespodable {
  readonly id_token?: string;
}

interface IdTokenResponse extends AccessTokenResponse, IdTokenRespodable {}

function isIdTokenResponse(
  accessTokenResponse: IdTokenResponse,
): accessTokenResponse is IdTokenResponse & Required<IdTokenRespodable> {
  return typeof accessTokenResponse.id_token === 'string';
}

function isIdTokenPayload(
  payload: Partial<IdTokenClaims>,
): payload is IdTokenClaims {
  return (
    typeof payload.iss === 'string' &&
    typeof payload.sub === 'string' &&
    (typeof payload.aud === 'string' || Array.isArray(payload.aud)) &&
    typeof payload.exp === 'number' &&
    typeof payload.iat === 'number'
  );
}

interface ReactiveData {
  readonly version: WritableSignal<number | undefined>;
  readonly infoResource: ResourceRef<IdTokenInfo | null | undefined>;
  readonly claimsResource: ResourceRef<IdTokenClaims | null | undefined>;
}

@Injectable({
  providedIn: 'root',
})
export class IdTokenExtractor implements AccessTokenResponseExtractor<IdTokenResponse> {
  private readonly defaultId = inject(ACCESS_TOKEN_ID);

  private readonly storage = inject(ID_TOKEN_STORAGE);

  private readonly claimsTransformer = inject(ID_TOKEN_CLAIMS_TRANSFORMER);

  private readonly verification = inject(ID_TOKEN_VERIFICATION);

  private readonly injector = inject(Injector);

  readonly #reactiveDataMap = new Map<IdKey, ReactiveData>();

  #getReactiveData(id: IdKey): ReactiveData {
    const reactiveData = this.#reactiveDataMap.get(id);

    if (typeof reactiveData !== 'undefined') {
      return reactiveData;
    }

    const version = signal<number | undefined>(undefined);
    const infoResource = resource({
      params: version,
      loader: async () => await this.loadInfo(id),
      injector: this.injector,
    });
    const claimsResource = resource({
      params: version,
      loader: async () => await this.loadClaims(id),
      injector: this.injector,
    });

    const newReactiveData = {
      version,
      infoResource,
      claimsResource,
    } as const satisfies ReactiveData;

    this.#reactiveDataMap.set(id, newReactiveData);

    return newReactiveData;
  }

  #initializeVersion<T>(id: IdKey, value: T): T {
    const { version } = this.#getReactiveData(id);

    version.update((version) => (typeof version === 'undefined' ? 0 : version));
    return value;
  }

  #updateVersion(id: IdKey, value: number): void {
    const { version } = this.#getReactiveData(id);

    version.update((version) =>
      typeof version === 'undefined' || value > version ? value : version,
    );
  }

  async update(
    id: IdKey,
    updatedData: AccessTokenResponseUpdatedData<IdTokenResponse>,
  ): Promise<void> {
    switch (updatedData.accessTokenResponse) {
      case storedData:
        return this.#updateVersion(id, updatedData.timestamp);
      case removedData:
        await this.storage.clear(id);

        return this.#updateVersion(id, updatedData.timestamp);
      default: {
        const [hasIdToken, idToken] = isIdTokenResponse(
          updatedData.accessTokenResponse,
        )
          ? ([true, updatedData.accessTokenResponse.id_token] as const)
          : ([false, updatedData.accessTokenResponse.access_token] as const);

        try {
          const idTokenInfo = deserializeJose<IdTokenClaims, JwtHeader>(
            idToken,
          );

          if (isJwt(idTokenInfo, 'JWS')) {
            if (!isIdTokenPayload(idTokenInfo.payload)) {
              throw new InvalidIdTokenPayloadError(id, idTokenInfo);
            }

            await this.verification(idTokenInfo);

            const oldClaims = await this.loadClaims(id);

            await Promise.all([
              this.storage.store(id, 'info', idTokenInfo),
              this.storage.store(
                id,
                'claims',
                oldClaims
                  ? this.claimsTransformer(oldClaims, idTokenInfo.payload)
                  : idTokenInfo.payload,
              ),
            ]);
          } else {
            throw new EncryptedIdTokenError(id, idTokenInfo);
          }
        } catch (error) {
          if (hasIdToken) {
            console.error(error);
          }
        }

        return this.#updateVersion(id, updatedData.timestamp);
      }
    }
  }

  async loadInfo(id = this.defaultId): Promise<IdTokenInfo | null> {
    return this.#initializeVersion(id, await this.storage.load(id, 'info'));
  }

  /**
   * Create `IdTokenInfo` _resource_.
   *
   * It triggers **_eager_** loading of `IdTokenInfo`, no `idle` _state_, if it
   * is **uninitialized** and updates whenever the `IdTokenInfo` is updated. It
   * also provides the current value of `IdTokenInfo` **without** failing to
   * `loading` _state_ if it is already available in snapshots.
   *
   * It uses `resourceFromSnapshots()` internally, so it **does not need**
   * _injection context_.
   *
   * @param id
   * @returns
   */
  infoResource(id = this.defaultId): Resource<IdTokenInfo | undefined> {
    const { version, infoResource } = this.#getReactiveData(id);

    if (typeof untracked(version) === 'undefined') {
      this.loadInfo(id);
    }

    return resourceFromSnapshots(
      linkedSignal({
        source: infoResource.snapshot,
        computation: (
          source,
          previous,
        ): ResourceSnapshot<IdTokenInfo | undefined> => {
          if (source.status === 'error') {
            return source;
          } else {
            if (typeof source.value === 'undefined') {
              return typeof previous?.value !== 'undefined'
                ? previous.value
                : {
                    status: 'loading',
                    value: undefined,
                  };
            } else {
              return source.value === null
                ? {
                    status: 'error',
                    error: new IdTokenInfoNotFoundError(id),
                  }
                : source.value.payload.exp < Date.now() / 1_000
                  ? {
                      status: 'error',
                      error: new IdTokenExpiredError(id, source.value),
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

  async loadClaims(id = this.defaultId): Promise<IdTokenClaims | null> {
    return this.#initializeVersion(id, await this.storage.load(id, 'claims'));
  }

  /**
   * Create `IdTokenClaims` _resource_.
   *
   * It triggers **_eager_** loading of `IdTokenClaims`, no `idle` _state_, if
   * it is **uninitialized** and updates whenever the `IdTokenClaims` is
   * updated. It also provides the current value of `IdTokenClaims` **without**
   * failing to `loading` _state_ if it is already available in snapshots.
   *
   * It uses `resourceFromSnapshots()` internally, so it **does not need**
   * _injection context_.
   *
   * @param id
   * @returns
   */
  claimsResource(id = this.defaultId): Resource<IdTokenClaims | undefined> {
    const { version, claimsResource } = this.#getReactiveData(id);

    if (typeof untracked(version) === 'undefined') {
      this.loadClaims(id);
    }

    return resourceFromSnapshots(
      linkedSignal({
        source: claimsResource.snapshot,
        computation: (
          source,
          previous,
        ): ResourceSnapshot<IdTokenClaims | undefined> => {
          if (source.status === 'error') {
            return source;
          } else {
            if (typeof source.value === 'undefined') {
              return typeof previous?.value !== 'undefined'
                ? previous.value
                : {
                    status: 'loading',
                    value: undefined,
                  };
            } else {
              return source.value === null
                ? {
                    status: 'error',
                    error: new IdTokenInfoNotFoundError(id),
                  }
                : source.value.exp < Date.now() / 1_000
                  ? {
                      status: 'error',
                      error: new IdTokenClaimsExpiredError(id, source.value),
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
