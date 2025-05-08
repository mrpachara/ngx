/** General stored data */
export interface StoredData<T> {
  /** The time that token will expire (unix timestamp) */
  readonly expiresAt: number;

  readonly data: T;
}

/** Storage for one instance data */
export interface SingalDataStorage<T> {
  loadData(): Promise<T>;
  storeData(data: T): Promise<void>;
  removeData(): Promise<void>;
}
