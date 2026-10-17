import { GitCommitHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_VERSION } from '@/lib/version';

const REPO_URL = 'https://github.com/joaodforce/wondermaid';

const environments = {
  production: { label: 'PROD', className: 'bg-emerald-500/20 text-emerald-300' },
  staging: { label: 'PRE', className: 'bg-amber-400/20 text-amber-300' },
  development: { label: 'DEV', className: 'bg-white/10 text-stone-300' },
} as const;

function getEnvironment() {
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV;
  if (appEnv === 'production' || appEnv === 'staging') return environments[appEnv];
  return process.env.NODE_ENV === 'production' ? null : environments.development;
}

// Sits in the bottom-right corner of the page so it is easy to check which release is live
export function VersionBadge() {
  const gitSha = process.env.NEXT_PUBLIC_GIT_SHA;
  const sha = gitSha && gitSha !== 'unknown' ? gitSha : null;
  const environment = getEnvironment();

  return (
    <div className="absolute right-3 bottom-3 z-10 flex items-center gap-2 rounded-full border border-black/30 bg-ink/90 px-2.5 py-1 text-[0.7rem] text-stone-400 shadow-lg backdrop-blur">
      {environment && (
        <span className={cn('rounded-full px-1.5 font-semibold tracking-wide', environment.className)}>
          {environment.label}
        </span>
      )}
      <span>v{APP_VERSION}</span>
      {sha && (
        <a
          href={`${REPO_URL}/commit/${sha}`}
          target="_blank"
          rel="noopener noreferrer"
          title={sha}
          className="flex items-center gap-1 font-mono hover:text-stone-100"
        >
          <GitCommitHorizontal className="h-3.5 w-3.5" aria-hidden />
          {sha.slice(0, 7)}
        </a>
      )}
    </div>
  );
}
