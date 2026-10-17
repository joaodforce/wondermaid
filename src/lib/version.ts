import { version as packageVersion } from '../../package.json';

/** Release version (CI passes NEXT_PUBLIC_APP_VERSION at build time); falls back to package.json */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || packageVersion;
