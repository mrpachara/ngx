import { isArray } from './utility';

export function assignRequestData<T extends URLSearchParams | FormData>(
  target: T,
  data: object,
  {
    params = {} as Readonly<
      Record<
        string,
        string | number | boolean | readonly (string | number | boolean)[]
      >
    >,
  } = {},
): T {
  Object.entries(data)
    .filter(([, value]) => typeof value !== 'undefined')
    .forEach(([key, value]) => target.set(key, `${value}`));

  Object.entries(params).forEach(([key, values]) => {
    (isArray(values) ? values : [values]).forEach((value) =>
      target.append(key, `${value}`),
    );
  });

  return target;
}
