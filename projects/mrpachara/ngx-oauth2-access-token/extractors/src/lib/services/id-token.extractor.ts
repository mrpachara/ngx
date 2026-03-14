import {
  inject,
  Injectable,
  Injector,
  linkedSignal,
  resource,
  ResourceRef,
  ResourceStreamItem,
  signal,
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
  IdTokenClaimsExpiredError,
  IdTokenClaimsNotFoundError,
  IdTokenEncryptedError,
  IdTokenInfoNotFoundError,
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
      default:
        if (isIdTokenResponse(updatedData.accessTokenResponse)) {
          try {
            const idTokenInfo = deserializeJose<IdTokenClaims, JwtHeader>(
              updatedData.accessTokenResponse.id_token,
            );

            if (isJwt(idTokenInfo, 'JWS')) {
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
              throw new IdTokenEncryptedError(id);
            }
          } catch (error) {
            console.error(error);

            await this.storage.clear(id);
          }

          return this.#updateVersion(id, updatedData.timestamp);
        } else {
          // TODO: check IdToken from _access token_.
        }
    }
  }

  async loadInfo(id = this.defaultId): Promise<IdTokenInfo | null> {
    return this.#initializeVersion(id, await this.storage.load(id, 'info'));
  }

  infoResource(id = this.defaultId) {
    const { infoResource } = this.#getReactiveData(id);

    return resource({
      stream: async () => {
        const initializedValue = await this.loadInfo(id);

        return linkedSignal({
          source: infoResource.snapshot,
          computation: (source, previous): ResourceStreamItem<IdTokenInfo> => {
            return source.status === 'error'
              ? { error: source.error }
              : typeof source.value !== 'undefined'
                ? source.value !== null
                  ? { value: source.value }
                  : { error: new IdTokenInfoNotFoundError(id) }
                : typeof previous !== 'undefined'
                  ? previous.value
                  : initializedValue !== null
                    ? { value: initializedValue }
                    : { error: new IdTokenInfoNotFoundError(id) };
          },
        });
      },
    }).asReadonly();
  }

  async loadClaims(id = this.defaultId): Promise<IdTokenClaims | null> {
    return this.#initializeVersion(id, await this.storage.load(id, 'claims'));
  }

  claimsResource(id = this.defaultId) {
    const { claimsResource } = this.#getReactiveData(id);

    return resource({
      stream: async () => {
        const initializedValue = await this.loadClaims(id);

        return linkedSignal({
          source: claimsResource.snapshot,
          computation: (
            source,
            previous,
          ): ResourceStreamItem<IdTokenClaims> => {
            return source.status === 'error'
              ? { error: source.error }
              : typeof source.value !== 'undefined'
                ? source.value !== null
                  ? source.value.exp < Date.now() / 1_000
                    ? { error: new IdTokenClaimsExpiredError(id, source.value) }
                    : { value: source.value }
                  : { error: new IdTokenClaimsNotFoundError(id) }
                : typeof previous !== 'undefined'
                  ? previous.value
                  : initializedValue !== null
                    ? { value: initializedValue }
                    : { error: new IdTokenClaimsNotFoundError(id) };
          },
        });
      },
    }).asReadonly();
  }
}
