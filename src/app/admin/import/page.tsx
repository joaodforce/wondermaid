import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { UidImporter } from '@/components/admin/uid-importer';
import { getSuperAdmin } from '@/modules/admin/services';

export const metadata: Metadata = { title: 'Import UIDs · Admin', robots: { index: false } };

export default function ImportPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 pt-8 pb-16 sm:px-6">
      <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl bg-ink/80" aria-hidden />}>
        <Importer />
      </Suspense>
    </main>
  );
}

async function Importer() {
  // Everyone but the super admin gets a plain 404, so the page doesn't advertise itself
  if (!(await getSuperAdmin())) notFound();
  return (
    <>
      <header>
        <p className="text-sm font-semibold tracking-[0.2em] text-rose-950/80 uppercase">Admin</p>
        <h1 className="mt-1 text-4xl font-black tracking-tight text-ink">Import UIDs</h1>
        <p className="mt-1 text-sm text-ink/75">
          Reads each UID from Enka and adds Noelle to the leaderboard, one at a time with a pause in between. Keep this tab
          open until it finishes.
        </p>
      </header>
      <UidImporter />
    </>
  );
}
