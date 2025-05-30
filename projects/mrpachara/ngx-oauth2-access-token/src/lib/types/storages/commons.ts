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

export interface KeyableDataStorage<M extends object> {
  load<const K extends keyof M>(key: K): Promise<M[K] | undefined>;
  store<const K extends keyof M>(key: K, data: M[K]): Promise<M[K]>;
  remove<const K extends keyof M>(key: K): Promise<M[K] | undefined>;
  clear(): Promise<void>;
}
