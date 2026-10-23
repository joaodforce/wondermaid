const SITE = 'http://wondermaid.invalid';
const FALLBACK = '/account';

/**
 * Where to send the user after signing in: only paths on this site, so the form can't be used as an open
 * redirect. Resolving against a dummy origin catches every trick browsers accept, like "//host", "/\host"
 * or a tab or newline between the slashes.
 */
export function safeNext(value: FormDataEntryValue | null): string {
  if (typeof value !== 'string' || !value.startsWith('/')) return FALLBACK;
  try {
    const url = new URL(value, SITE);
    return url.origin === SITE ? `${url.pathname}${url.search}${url.hash}` : FALLBACK;
  } catch {
    return FALLBACK;
  }
}
