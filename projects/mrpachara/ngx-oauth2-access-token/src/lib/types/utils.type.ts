export type PickOptional<T> = {
  [K in keyof T as undefined extends T[K] ? K : never]-?: T[K];
};

export type RequiredExcept<T, K extends keyof T> = Required<Omit<T, K>> &
  Pick<T, K>;

// export type RequiredOnly<T, K extends keyof T> = Required<Pick<T, K>> &
//   Omit<T, K>;

export type RequiredOnly<T, K extends keyof T> = T & {
  [P in K]-?: T[P];
};

// export type UndefinedOnly<T, K extends keyof T> = Omit<T, K> & {
//   [prob in K]: undefined;
// };

export type UndefinedOnly<T, K extends keyof T> = T & {
  [P in K]: undefined;
};

export type Provided<T, K extends keyof T> = RequiredOnly<T, K>;
