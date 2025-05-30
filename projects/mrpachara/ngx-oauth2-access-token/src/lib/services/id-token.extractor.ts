import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { deserializeJose, isJwt } from '../helpers';
import { ID_TOKEN_STORAGE } from '../tokens/id-token';
import {
  AccessTokenResponse,
  IdTokenClaims,
  IdTokenInfo,
  JwtHeader,
} from '../types';
import { AccessTokenService } from './access-token.service';

interface IdTokenResponse {
  readonly id_token?: string;
}

function isIdTokenResponse(
  accessTokenResponse: AccessTokenResponse & IdTokenResponse,
): accessTokenResponse is AccessTokenResponse & Required<IdTokenResponse> {
  return typeof accessTokenResponse.id_token === 'string';
}

@Injectable()
export class IdTokenExtractor {
  private readonly accessTokenService = inject(AccessTokenService);

  private readonly storage = inject(ID_TOKEN_STORAGE);

  get id() {
    return this.accessTokenService.id;
  }

  get name() {
    return this.accessTokenService.name;
  }

  constructor() {
    this.accessTokenService.accessTokenResponse
      .pipe(takeUntilDestroyed())
      .subscribe(async (accessTokenResponse) => {
        if (accessTokenResponse === null) {
          return await this.storage.clear();
        }

        if (isIdTokenResponse(accessTokenResponse)) {
          const idTokenInfo = deserializeJose<IdTokenClaims, JwtHeader>(
            accessTokenResponse.id_token,
          );

          if (isJwt(idTokenInfo, 'JWS')) {
            return void (await Promise.all([
              this.storage.store('info', idTokenInfo),
              this.storage.store('claims', idTokenInfo.payload),
            ]));
          }
        }
      });
  }

  async loadInfo(): Promise<IdTokenInfo | undefined> {
    return await this.storage.load('info');
  }

  async loadClaims(): Promise<IdTokenClaims | undefined> {
    return await this.storage.load('claims');
  }
}
