import { computed, inject, Injectable, resource, signal } from '@angular/core';
import {
  IdTokenClaimsNotFoundError,
  IdTokenEncryptedError,
  IdTokenInfoNotFoundError,
} from '../errors';
import { deserializeJose, isJwt } from '../helpers';
import { ID_TOKEN_STORAGE } from '../tokens/id-token';
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
export class IdTokenExtractor
  implements AccessTokenResponseExtractor<IdTokenResponse>
{
  private readonly storage = inject(ID_TOKEN_STORAGE);

  private _id?: symbol;

  get id() {
    return this._id;
  }

  get name() {
    return this.id?.description ?? '[non-registered]';
  }

  readonly #ready = signal<boolean | undefined>(undefined);

  readonly #lastUpdated = signal<number | undefined>(undefined);

  readonly #internalUpdated = computed(() =>
    typeof this.#ready() === 'undefined'
      ? undefined
      : (this.#lastUpdated() ?? Date.now()),
  );

  register(id: symbol): this {
    if (typeof this._id !== 'undefined') {
      throw new Error(
        `Extractor must be registered once. But '${this.name}' is re-registered again with '${id.description ?? '[unknown]'}'`,
      );
    }

    this._id = id;

    return this;
  }

  ready(status: boolean): void {
    this.#ready.set(status);
  }

  async update(
    updatedData: AccessTokenResponseUpdatedData<IdTokenResponse>,
  ): Promise<void> {
    switch (updatedData.accessTokenResponse) {
      case storedData:
        return this.#lastUpdated.set(updatedData.timestamp);
      case removedData:
        await this.storage.clear();

        return this.#lastUpdated.set(updatedData.timestamp);
      default:
        if (isIdTokenResponse(updatedData.accessTokenResponse)) {
          try {
            const idTokenInfo = deserializeJose<IdTokenClaims, JwtHeader>(
              updatedData.accessTokenResponse.id_token,
            );

            if (isJwt(idTokenInfo, 'JWS')) {
              // TODO: merge claims
              await Promise.all([
                this.storage.store('info', idTokenInfo),
                this.storage.store('claims', idTokenInfo.payload),
              ]);
            } else {
              throw new IdTokenEncryptedError(this.name);
            }
          } catch (err) {
            console.error(err);

            await this.storage.clear();
          }

          return this.#lastUpdated.set(updatedData.timestamp);
        }
    }
  }

  async loadInfo(): Promise<IdTokenInfo | undefined> {
    return await this.storage.load('info');
  }

  infoResource() {
    return resource({
      params: () => this.#internalUpdated(),
      loader: async () => {
        const result = await this.loadInfo();

        if (typeof result === 'undefined') {
          throw new IdTokenInfoNotFoundError(this.name);
        }

        return result;
      },
      equal: (oldValue, newValue) => oldValue.serial === newValue.serial,
    });
  }

  async loadClaims(): Promise<IdTokenClaims | undefined> {
    return await this.storage.load('claims');
  }

  claimsResource() {
    return resource({
      params: () => this.#internalUpdated(),
      loader: async () => {
        const result = await this.loadClaims();

        if (typeof result === 'undefined') {
          throw new IdTokenClaimsNotFoundError(this.name);
        }

        return result;
      },
    });
  }
}
