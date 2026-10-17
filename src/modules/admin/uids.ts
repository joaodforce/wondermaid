const UID_PATTERN = /\b\d{9,10}\b/g;

/** Every distinct 9 or 10 digit UID in pasted text, in order. Any separator works: lines, commas, spaces, a CSV column. */
export function parseUids(text: string): string[] {
  return [...new Set(text.match(UID_PATTERN) ?? [])];
}
