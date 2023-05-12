export type PickOptional<T> = {
  [K in keyof T as undefined extends T[K] ? K : never]-?: T[K];
};

export type RequiredExcept<T, K extends keyof T> = Required<Omit<T, K>> &
  Pick<T, K>;
