/** General stored data */
export interface StoredData<T> {
  /** The time that token will expire (unix timestamp) */
  readonly expiresAt: number;

  readonly data: T;
}

/** Storage for one instance data */
export interface SingalDataStorage<T> {
  loadData(): Promise<T | undefined>;
  storeData(data: T): Promise<T>;
  removeData(): Promise<T | undefined>;
}

export interface KeyableDataStorage<M extends object> {
  loadData<const K extends keyof M>(key: K): Promise<M[K] | undefined>;
  storeData<const K extends keyof M>(key: K, data: M[K]): Promise<M[K]>;
  removeData<const K extends keyof M>(key: K): Promise<M[K] | undefined>;
  clear(): Promise<void>;
}
