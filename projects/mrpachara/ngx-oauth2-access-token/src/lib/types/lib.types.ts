export interface CreatableFactory<T> {
  create(name: string): T;
}
