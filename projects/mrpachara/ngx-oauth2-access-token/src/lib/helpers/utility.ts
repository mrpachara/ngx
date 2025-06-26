import {
  effect,
  Resource,
  resource,
  ResourceRef,
  ResourceStreamItem,
  signal,
  Signal,
} from '@angular/core';
import { fromEvent, Observable, pipe, take, takeUntil } from 'rxjs';
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

export function isArray<T>(obj: T): obj is Extract<T, readonly unknown[]> {
  return Array.isArray(obj);
}

export async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const ac = new AbortController();

    const settle = (reason?: unknown) => {
      ac.abort();
      clearTimeout(handler);

      if (typeof reason === 'undefined') {
        resolve();
      } else {
        reject(reason);
      }
    };

    const handler = setTimeout(settle, ms);

    signal?.addEventListener('abort', settle, { signal: ac.signal });
  });
}

export function takeUntilAbortignal<T>(signal?: AbortSignal) {
  if (typeof signal === 'undefined') {
    return pipe();
  }

  // NOTE: take(1) may not needed
  return pipe(takeUntil<T>(fromEvent(signal, 'message')));
}

export function abortSignalFromObservable<T>(observable: Observable<T>): {
  readonly signal: AbortSignal;
  readonly unsubcript: () => void;
} {
  const ac = new AbortController();

  const subscription = observable
    .pipe(take(1))
    .subscribe((reason) => ac.abort(reason));

  return {
    signal: ac.signal,
    unsubcript: () => subscription.unsubscribe(),
  } as const;
}

export function withResolvers<T>(): {
  readonly promise: Promise<T>;
  readonly resolve: (value: T | PromiseLike<T>) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly reject: (reason?: any) => void;
} {
  let resolve!: (value: T | PromiseLike<T>) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let reject!: (reason?: any) => void;
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });

  return { promise, resolve, reject } as const;
}

export function flatStreamResource<T>(
  source: Resource<T>,
): ResourceRef<T | undefined> {
  const { promise, resolve } = withResolvers<Signal<ResourceStreamItem<T>>>();

  const streamItem = signal<ResourceStreamItem<T>>({
    error: new Error('initializing'),
  });

  effect(() => {
    const status = source.status();

    if (status === 'resolved' || status === 'local' || status === 'error') {
      streamItem.set(
        source.hasValue()
          ? { value: source.value() }
          : { error: source.error()! },
      );

      resolve(streamItem);
    }
  });

  return resource({ stream: async () => await promise });
}
