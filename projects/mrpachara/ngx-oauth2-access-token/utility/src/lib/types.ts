/** TypeScript primative types */
export type Primitive =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | undefined
  | null;

/** Pick only the optional properties */
export type PickOptional<T> = {
  [K in keyof T as undefined extends T[K] ? K : never]-?: T[K];
};

/** Pick the optional properties except K */
export type PickOptionalExcept<T, K extends keyof T> = PickOptional<Omit<T, K>>;

/** Make all properties in T required except K */
export type RequiredExcept<T, K extends keyof T> = Required<Omit<T, K>> &
  Pick<T, K>;

// export type RequiredOnly<T, K extends keyof T> = Required<Pick<T, K>> &
//   Omit<T, K>;

/** Make K properties in T required */
export type RequiredOnly<T, K extends keyof T> = T & {
  [P in K]-?: T[P];
};

// export type UndefinedOnly<T, K extends keyof T> = Omit<T, K> & {
//   [prob in K]: undefined;
// };

export type MakeNever<T> = {
  [prob in keyof T]?: never;
};

/** Make K properties in T undefined */
export type UndefinedOnly<T, K extends keyof T> = T & Record<K, undefined>;

/** Alias of `RequiredOnly` for more clear meaning */
export type Provided<T, K extends keyof T> = RequiredOnly<T, K>;

/** Alias of `NeverOnly` for more clear meaning */
export type Nonprovided<T, K extends keyof T> = UndefinedOnly<T, K>;

/** Mak all properties and nested properties of T readonly */
export type DeepReadonly<T> = T extends Primitive
  ? Readonly<T>
  : {
      readonly [P in keyof T]: DeepReadonly<T[P]>;
    };
