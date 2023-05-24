import { StateActionInfo, StateActionType } from '../types';

export function parseStateAction(
  stateAction: StateActionType,
): StateActionInfo {
  const separatorIndex = stateAction.search(':');

  if (separatorIndex < 0) {
    throw new Error('Wrong state action format.');
  }

  const action = stateAction.slice(0, separatorIndex);
  const dataJson = stateAction.slice(separatorIndex + 1);

  const data = JSON.parse(dataJson);

  return { action, data };
}

export function stringifyStateAction(
  stateActionInfo: StateActionInfo,
): StateActionType {
  return `${stateActionInfo.action}:${JSON.stringify(stateActionInfo.data)}`;
}
