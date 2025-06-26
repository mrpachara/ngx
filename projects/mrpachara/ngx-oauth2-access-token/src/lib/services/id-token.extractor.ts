import { inject, Injectable, resource, signal } from '@angular/core';
import {
  IdTokenClaimsNotFoundError,
  IdTokenEncryptedError,
  IdTokenInfoNotFoundError,
} from '../errors';
import { deserializeJose, flatStreamResource, isJwt } from '../helpers';
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
export class IdTokenExtractor
  implements AccessTokenResponseExtractor<IdTokenResponse>
{
  readonly #id = inject(EXTRACTOR_ID);

  private readonly storage = inject(ID_TOKEN_STORAGE);

  private readonly claimsTransformer = inject(ID_TOKEN_CLAIMS_TRANSFORMER);

  private readonly verification = inject(ID_TOKEN_VERIFICATION);

  get id() {
    return this.#id;
  }

  get name() {
    return this.id.description ?? '[unknown]';
  }

  readonly #lastUpdated = signal<number | undefined>(undefined);

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
    return flatStreamResource(
      resource({
        params: () => this.#lastUpdated() ?? Date.now(),
        loader: async () => {
          const result = await this.loadInfo();

          if (typeof result === 'undefined') {
            throw new IdTokenInfoNotFoundError(this.name);
          }

          return result;
        },
        equal: (oldValue, newValue) => oldValue.serial === newValue.serial,
      }),
    ).asReadonly();
  }

  async loadClaims(): Promise<IdTokenClaims | undefined> {
    return await this.storage.load('claims');
  }

  claimsResource() {
    return flatStreamResource(
      resource({
        params: () => this.#lastUpdated() ?? Date.now(),
        loader: async () => {
          const result = await this.loadClaims();

          if (typeof result === 'undefined') {
            throw new IdTokenClaimsNotFoundError(this.name);
          }

          return result;
        },
      }),
    ).asReadonly();
  }
}
