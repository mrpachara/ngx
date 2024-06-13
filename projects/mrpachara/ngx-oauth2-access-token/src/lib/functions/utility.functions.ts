import { DeepReadonly } from '../types';

/**
 * Make `obj` to be deep frozen.
 *
 * @param obj The object to be frozen
 * @returns The immuable object
 */
export function deepFreeze<T = unknown>(obj: T): DeepReadonly<T> {
  const frozenObjSet = new Set<unknown>();
  const queue: unknown[] = [];

  const enqueue = (value: unknown): value is object => {
    if (
      typeof value === 'object' &&
      (value ?? null) !== null &&
      !frozenObjSet.has(value)
    ) {
      queue.push(value);

      return true;
    }

    return false;
  };

  enqueue(obj);

  while (queue.length > 0) {
    const frozenObj = Object.freeze(queue.shift());
    frozenObjSet.add(frozenObj);

    Object.keys(frozenObj).forEach((key) => {
      const nextObj = (frozenObj as Record<string, unknown>)[key];
      enqueue(nextObj);
    });
  }

  return obj as DeepReadonly<T>;
}
