import { JwtInfo } from '../jwt';
import { IdTokenClaims } from '../standard';

export type StoredIdToken<T extends IdTokenClaims = IdTokenClaims> = JwtInfo<T>;

export interface IdTokenStorage {
  load<T extends IdTokenClaims = IdTokenClaims>(
    key: string,
  ): Promise<StoredIdToken<T> | undefined>;
  store<T extends IdTokenClaims = IdTokenClaims>(
    key: string,
    data: StoredIdToken<T>,
  ): Promise<StoredIdToken<T>>;
  remove<T extends IdTokenClaims = IdTokenClaims>(
    key: string,
  ): Promise<StoredIdToken<T> | undefined>;
}
