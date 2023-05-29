import {
  StateAction,
  StateActionHandler,
  StateActionInfo,
  StateActionProvided,
} from '../types';

export function isStateActionProvided<T extends StateActionInfo>(
  obj: StateAction<T>,
): obj is StateActionProvided<StateAction<T>> {
  return typeof obj.action !== 'undefined';
}

export function castActionHandler<T extends StateActionInfo>(
  actionHandler: StateActionHandler<StateAction<T>, unknown>,
): StateActionHandler<StateAction, unknown> {
  return actionHandler as StateActionHandler<StateAction, unknown>;
}
