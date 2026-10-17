import { LogOut, UserRound } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { logoutAction } from '@/app/actions/auth';
import { isSuperAdmin } from '@/modules/admin/services';
import { getCurrentUser } from '@/modules/auth/session';

const linkClass = 'rounded-lg px-2 py-1.5 text-sm font-medium whitespace-nowrap text-ink/80 hover:bg-ink/10 hover:text-ink sm:px-3';

export function SiteNav() {
  return (
    <nav className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-1 px-2 pt-4 sm:gap-2 sm:px-6">
      <div className="flex items-center gap-1">
        <Link href="/" className={linkClass}>
          Leaderboard
        </Link>
        <Link href="/team-showcase" className={linkClass}>
          <span className="sm:hidden">Teams</span>
          <span className="hidden sm:inline">Team Showcase</span>
        </Link>
      </div>
      <Suspense fallback={<div className="h-8 w-24" />}>
        <UserMenu />
      </Suspense>
    </nav>
  );
}

async function UserMenu() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="flex items-center gap-1">
        <Link href="/login" className={linkClass}>
          Log in
        </Link>
        <Link href="/register" className="rounded-lg bg-ink px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-stone-100 hover:bg-black">
          Sign up
        </Link>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1">
      {isSuperAdmin(user) && (
        <Link href="/admin/import" className={linkClass}>
          Admin
        </Link>
      )}
      <Link href="/account" className={`${linkClass} inline-flex items-center gap-1.5`}>
        <UserRound className="h-4 w-4" aria-hidden />
        {user.username}
      </Link>
      <form action={logoutAction}>
        <button type="submit" className={`${linkClass} inline-flex items-center`} title="Log out">
          <LogOut className="h-4 w-4" aria-hidden />
          <span className="sr-only">Log out</span>
        </button>
      </form>
    </div>
  );
}
