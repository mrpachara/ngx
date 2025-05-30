const existingIdName = new Set<string>();

export function createIdSymbol(name: string): symbol {
  if (existingIdName.has(name)) {
    throw new Error(`ID '${name}' already exists.`);
  }

  existingIdName.add(name);

  return Symbol(name);
}
