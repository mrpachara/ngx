export async function promisifyTransaction<T>(
  transaction: IDBTransaction,
  process: (transaction: IDBTransaction) => Promise<T> | T,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const ac = new AbortController();

    Object.entries({
      complete: async () => resolve(await result),
      error: (transaction: IDBTransaction) => reject(transaction.error),
      abort: (transaction: IDBTransaction) => reject(transaction.error),
    }).forEach(([event, fn]) =>
      transaction.addEventListener(
        event,
        (ev) => {
          ac.abort();

          fn(ev.target as IDBTransaction);
        },
        { signal: ac.signal },
      ),
    );

    const result = process(transaction);
  });
}

export function promisifyRequest<T = undefined>(
  request: IDBRequest<T>,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const ac = new AbortController();

    Object.entries({
      success: (req: typeof request) => resolve(req.result),
      error: (req: typeof request) => reject(req.error),
    }).forEach(([event, fn]) =>
      request.addEventListener(
        event,
        (ev) => {
          ac.abort();

          fn(ev.target as typeof request);
        },
        { signal: ac.signal },
      ),
    );
  });
}

export async function* cursorAsyncIterable<T extends IDBCursor>(
  request: IDBRequest<T | null>,
) {
  while (true) {
    const cursor = await promisifyRequest(request);

    if (cursor === null) {
      return;
    }

    yield cursor;

    cursor.continue();
  }
}
