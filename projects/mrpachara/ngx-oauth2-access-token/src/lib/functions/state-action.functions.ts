import { StateAction, StateActionInfo, StateActionProvided } from '../types';

export function isStateActionProvided<T extends StateActionInfo>(
  obj: StateAction<T>,
): obj is StateActionProvided<StateAction<T>> {
  return typeof obj.action !== 'undefined';
}
