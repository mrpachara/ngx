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

/** Make K properties in T undefined */
export type UndefinedOnly<T, K extends keyof T> = T & {
  [P in K]: undefined;
};

/** Alias of `RequiredOnly` for more clear meaning */
export type Provided<T, K extends keyof T> = RequiredOnly<T, K>;

/** Mak all properties and nested properties of T readonly */
export type DeepReadonly<T> = T extends Primitive
  ? Readonly<T>
  : {
      readonly [P in keyof T]: DeepReadonly<T[P]>;
    };

// NOTE: just for testing
// type xxx = DeepReadonly<number[]>;
// type yyy = DeepReadonly<[number, string, boolean, 'abcd']>;
// const sym = Symbol('abcd');
// type zzz = DeepReadonly<{
//   a: number;
//   b?: string;
//   c: Array<{
//     e: number | null;
//     f?: [number, boolean, string];
//   }>;
//   d: {
//     e?: {
//       f: number[];
//       g: (
//         | string
//         | {
//             h?: ['a', 'b'];
//           }
//       )[];
//     };
//   };
//   [sym]: number;
// }>;
