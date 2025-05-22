import { Uuid } from '../../types';

/** General stored data */
export interface StoredData<T> {
  /** The time that token will expire (unix timestamp) */
  readonly expiresAt: number;

  readonly data: T;
}

export interface Lockable {
  lock(): Promise<void>;
  release(): Promise<void>;
}

/** Storage for one instance data */
export interface SingalDataStorage<T> extends Lockable {
  loadData(): Promise<T | undefined>;
  storeData(data: T): Promise<T>;
  removeData(): Promise<T | undefined>;
}

export interface KeyableDataStorage<M extends object> extends Lockable {
  load<const K extends keyof M>(key: K): Promise<M[K] | undefined>;
  store<const K extends keyof M>(key: K, data: M[K]): Promise<M[K]>;
  remove<const K extends keyof M>(key: K): Promise<M[K] | undefined>;
  clear(): Promise<void>;
}

export interface StorageMessageType<T extends string> {
  readonly type: T;
  readonly timestamp: number;
  readonly from: Uuid;
  readonly to?: Uuid;
}

export const lockAnswerWaitingTime = 100;

export type StorageMessage =
  | StorageMessageType<'alive'>
  | StorageMessageType<'alive-ack'>
  | StorageMessageType<'release'>;
