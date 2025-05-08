import { StateAction, StateActionInfo, StateActionProvided } from '../types';

/**
 * Type guard for provided state action in state data
 *
 * @param stateData The state data to be checked
 * @returns `true` whe `stateData` is `StateActionProvided<StateAction<T>>`
 */
export function isStateActionProvided<T extends StateActionInfo>(
  stateData: StateAction<T>,
): stateData is StateActionProvided<StateAction<T>> {
  return typeof stateData.action !== 'undefined';
}
