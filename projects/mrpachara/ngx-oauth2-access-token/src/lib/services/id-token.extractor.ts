// TODO: separate extractor to sub entry point
import {
  inject,
  Injectable,
  linkedSignal,
  resource,
  ResourceStreamItem,
  signal,
} from '@angular/core';
import {
  IdTokenClaimsNotFoundError,
  IdTokenEncryptedError,
  IdTokenInfoNotFoundError,
} from '../errors';
import { deserializeJose, isJwt } from '../helpers';
import { EXTRACTOR_ID } from '../tokens';
import {
  ID_TOKEN_CLAIMS_TRANSFORMER,
  ID_TOKEN_STORAGE,
  ID_TOKEN_VERIFICATION,
} from '../tokens/id-token';
import {
  AccessTokenResponse,
  AccessTokenResponseExtractor,
  AccessTokenResponseUpdatedData,
  IdTokenClaims,
  IdTokenInfo,
  JwtHeader,
  removedData,
  storedData,
} from '../types';

interface IdTokenRespodable {
  readonly id_token?: string;
}

interface IdTokenResponse extends AccessTokenResponse, IdTokenRespodable {}

function isIdTokenResponse(
  accessTokenResponse: IdTokenResponse,
): accessTokenResponse is IdTokenResponse & Required<IdTokenRespodable> {
  return typeof accessTokenResponse.id_token === 'string';
}

@Injectable()
export class IdTokenExtractor implements AccessTokenResponseExtractor<IdTokenResponse> {
  readonly #id = inject(EXTRACTOR_ID);

  private readonly storage = inject(ID_TOKEN_STORAGE);

  private readonly claimsTransformer = inject(ID_TOKEN_CLAIMS_TRANSFORMER);

  private readonly verification = inject(ID_TOKEN_VERIFICATION);

  get id() {
    return this.#id;
  }

  readonly #version = signal<number | undefined>(undefined);

  #initializeVersion<T>(value: T): T {
    this.#version.update((version) =>
      typeof version === 'undefined' ? 0 : version,
    );
    return value;
  }

  #updateVersion(value: number): void {
    this.#version.update((version) =>
      value > (version ?? -Infinity) ? value : version,
    );
  }

  async update(
    updatedData: AccessTokenResponseUpdatedData<IdTokenResponse>,
  ): Promise<void> {
    switch (updatedData.accessTokenResponse) {
      case storedData:
        return this.#updateVersion(updatedData.timestamp);
      case removedData:
        await this.storage.clear();

        return this.#updateVersion(updatedData.timestamp);
      default:
        if (isIdTokenResponse(updatedData.accessTokenResponse)) {
          try {
            const idTokenInfo = deserializeJose<IdTokenClaims, JwtHeader>(
              updatedData.accessTokenResponse.id_token,
            );

            if (isJwt(idTokenInfo, 'JWS')) {
              await this.verification(idTokenInfo);

              const oldClaims = await this.loadClaims();

              await Promise.all([
                this.storage.store('info', idTokenInfo),
                this.storage.store(
                  'claims',
                  oldClaims
                    ? this.claimsTransformer(oldClaims, idTokenInfo.payload)
                    : idTokenInfo.payload,
                ),
              ]);
            } else {
              throw new IdTokenEncryptedError(this.id);
            }
          } catch (error) {
            console.error(error);

            await this.storage.clear();
          }

          return this.#updateVersion(updatedData.timestamp);
        }
    }
  }

  readonly #idTokenInfoResource = resource({
    params: this.#version,
    loader: async () => await this.loadInfo(),
  });

  async loadInfo(): Promise<IdTokenInfo | null> {
    return this.#initializeVersion(await this.storage.load('info'));
  }

  infoResource() {
    return resource({
      stream: async () => {
        const initializedValue = await this.loadInfo();

        return linkedSignal({
          source: this.#idTokenInfoResource.snapshot,
          computation: (source, previous): ResourceStreamItem<IdTokenInfo> => {
            return source.status === 'error'
              ? { error: source.error }
              : typeof source.value !== 'undefined'
                ? source.value !== null
                  ? { value: source.value }
                  : { error: new IdTokenInfoNotFoundError(this.id) }
                : typeof previous !== 'undefined'
                  ? previous.value
                  : initializedValue !== null
                    ? { value: initializedValue }
                    : { error: new IdTokenInfoNotFoundError(this.id) };
          },
        });
      },
    }).asReadonly();
  }

  readonly #idTokenClaimsResource = resource({
    params: this.#version,
    loader: async () => await this.loadClaims(),
  });

  async loadClaims(): Promise<IdTokenClaims | null> {
    return this.#initializeVersion(await this.storage.load('claims'));
  }

  claimsResource() {
    return resource({
      stream: async () => {
        const initializedValue = await this.loadClaims();

        return linkedSignal({
          source: this.#idTokenClaimsResource.snapshot,
          computation: (
            source,
            previous,
          ): ResourceStreamItem<IdTokenClaims> => {
            return source.status === 'error'
              ? { error: source.error }
              : typeof source.value !== 'undefined'
                ? source.value !== null
                  ? { value: source.value }
                  : { error: new IdTokenClaimsNotFoundError(this.id) }
                : typeof previous !== 'undefined'
                  ? previous.value
                  : initializedValue !== null
                    ? { value: initializedValue }
                    : { error: new IdTokenClaimsNotFoundError(this.id) };
          },
        });
      },
    }).asReadonly();
  }
}
