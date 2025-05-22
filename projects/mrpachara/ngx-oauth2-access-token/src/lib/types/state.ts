import { StoredData } from './storages';

export interface StoredStateData<T> extends StoredData<T> {
  readonly codeVerifier?: string;
}
