import { StoredStateData } from '../../types';

export interface IndexedStateData<T> {
  readonly name: string;
  readonly state: string;
  readonly data: StoredStateData<T>;
}

export const stateObjectStoreName = 'states';
