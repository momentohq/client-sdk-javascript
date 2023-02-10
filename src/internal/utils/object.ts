export function fromEntries(entries: [string, unknown][]): object {
  return entries.reduce((acc, [key, value]) => ({...acc, [key]: value}), {});
}
