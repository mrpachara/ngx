import {
  StateAction,
  StateActionHandler,
  StateActionInfo,
  StateActionProvided,
} from '../types';

export function isStateActionProvided<N extends string, T>(
  obj: StateAction<StateActionInfo<N, T>>,
): obj is StateActionProvided<StateAction<StateActionInfo<N, T>>> {
  return typeof obj.action !== 'undefined';
}

export function castActionHandler<T extends StateActionInfo>(
  actionHandler: StateActionHandler<StateAction<T>, unknown>,
): StateActionHandler<StateAction, unknown> {
  return actionHandler as StateActionHandler<StateAction, unknown>;
}
