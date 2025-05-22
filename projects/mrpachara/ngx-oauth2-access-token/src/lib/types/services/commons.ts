export type AdditionalParams = Readonly<
  Record<
    string,
    string | number | boolean | readonly (string | number | boolean)[]
  >
>;
