import {
  computed,
  inject,
  Injectable,
  resource,
  signal,
  untracked,
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
  loadedData,
  removedData,
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

  get name() {
    return this.id.description ?? '[unknown]';
  }

  async #loadAll() {
    await Promise.allSettled([this.loadInfo(), this.loadClaims()] as const);
  }

  async update(
    updatedData: AccessTokenResponseUpdatedData<IdTokenResponse>,
  ): Promise<void> {
    switch (updatedData.accessTokenResponse) {
      case loadedData:
        return void (await this.#loadAll());
      case removedData:
        await this.storage.clear();

        return void (await this.#loadAll());
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
        }
    }
  }

  readonly #idTokenInfo = signal<IdTokenInfo | null>(null, {
    equal: (previous, current) => previous?.serial === current?.serial,
  });

  #updateIdTokenInfo<const T extends IdTokenInfo | null>(value: T): T {
    return untracked(() => {
      this.#idTokenInfo.set(value);

      return value;
    });
  }

  async loadInfo(): Promise<IdTokenInfo | null> {
    return this.#updateIdTokenInfo((await this.storage.load('info')) ?? null);
  }

  infoResource() {
    return resource({
      stream: async () => {
        await this.loadInfo();

        return computed(() => {
          const value = this.#idTokenInfo();

          return value !== null
            ? { value }
            : { error: new IdTokenInfoNotFoundError(this.name) };
        });
      },
    }).asReadonly();
  }

  readonly #idTokenClaims = signal<IdTokenClaims | null>(null, {
    equal: (previous, current) =>
      JSON.stringify(previous) === JSON.stringify(current),
  });

  #updateIdTokenClaims<const T extends IdTokenClaims | null>(value: T): T {
    return untracked(() => {
      this.#idTokenClaims.set(value);

      return value;
    });
  }

  async loadClaims(): Promise<IdTokenClaims | null> {
    return this.#updateIdTokenClaims(
      (await this.storage.load('claims')) ?? null,
    );
  }

  claimsResource() {
    return resource({
      stream: async () => {
        await this.loadClaims();

        return computed(() => {
          const value = this.#idTokenClaims();

          return value !== null
            ? { value }
            : { error: new IdTokenClaimsNotFoundError(this.name) };
        });
      },
    }).asReadonly();
  }
}
