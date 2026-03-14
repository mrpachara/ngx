import { StoredStateData } from '../../../lib/types';

export interface IndexedStateData<T> {
  readonly name: string;
  readonly state: string;
  readonly data: StoredStateData<T>;
}

export const stateObjectStoreName = 'states';
