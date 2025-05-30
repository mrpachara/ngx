/** The type of OAuth scopes */
export type Scopes = readonly [string, ...string[]];

/** Additional parameters for requesting */
export type AdditionalParams = Readonly<
  Record<
    string,
    string | number | boolean | readonly (string | number | boolean)[]
  >
>;
