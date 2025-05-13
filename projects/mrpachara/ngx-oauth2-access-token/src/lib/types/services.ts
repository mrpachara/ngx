interface AccessTokenBaseMessage<T extends string> {
  readonly type: T;
  readonly uuid: ReturnType<(typeof crypto)['randomUUID']>;
  readonly timestamp: number;
  readonly to?: ReturnType<(typeof crypto)['randomUUID']>;
}

export type AccessTokenMessage =
  | AccessTokenBaseMessage<'sync'>
  | AccessTokenBaseMessage<'lock'>
  | AccessTokenBaseMessage<'release'>
  | AccessTokenBaseMessage<'external-storing'>;
