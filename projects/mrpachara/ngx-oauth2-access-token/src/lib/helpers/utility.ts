import { DeepReadonly } from '../types';

/**
 * Make `obj` to be deep frozen.
 *
 * @param obj The object to be frozen
 * @returns The immuable object
 */
export function deepFreeze<T>(value: T): DeepReadonly<T> {
  const frozenObjSet = new WeakSet<object>();
  const queue: NonNullable<object>[] = [];

  const enqueue = (value: unknown): value is NonNullable<object> => {
    if (typeof value === 'object' && value && !frozenObjSet.has(value)) {
      queue.push(value);

      return true;
    }

    return false;
  };

  enqueue(value);

  while (queue.length > 0) {
    const frozenObj = Object.freeze(queue.shift()!);
    frozenObjSet.add(frozenObj);

    if (Array.isArray(frozenObj)) {
      frozenObj.forEach((value) => enqueue(value));
    } else {
      Object.keys(frozenObj).forEach((key) => {
        const value = (frozenObj as Record<string, unknown>)[key];
        enqueue(value);
      });
    }
  }

  return value as DeepReadonly<T>;
}
