/** General stored data */
export interface StoredData<T> {
  /** The time that token will expire (unix timestamp) */
  readonly expiresAt: number;

  readonly data: T;
}

export interface KeyableDataStorage<M extends object> {
  load<const K extends keyof M>(key: K): Promise<M[K] | null>;
  store<const K extends keyof M>(key: K, data: M[K]): Promise<M[K]>;
  remove<const K extends keyof M>(key: K): Promise<M[K] | null>;
  clear(): Promise<void>;
}

export type StorageVersionChangedReloader = (info: {
  readonly serviceName: string;
  readonly oldVersion: number;
  readonly newVersion: number | null;
}) => void | Promise<void>;
