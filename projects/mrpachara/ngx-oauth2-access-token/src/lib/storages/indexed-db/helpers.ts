export function promiseWrapper<T = unknown>(
  request: IDBRequest<T>,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const ac = new AbortController();

    Object.entries({
      success: () => resolve(request.result),
      error: () => reject(request.error),
    }).forEach(([event, fn]) =>
      request.addEventListener(
        event,
        () => {
          ac.abort();
          fn();
        },
        { signal: ac.signal },
      ),
    );
  });
}
