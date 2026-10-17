import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <h1 className="text-4xl font-black text-ink">Nothing to clean up here</h1>
      <p className="text-ink/80">
        This player isn&apos;t on the leaderboard yet. Submit their UID on the home page to add their Noelle.
      </p>
      <Link href="/" className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-stone-100 hover:bg-black">
        Back to the leaderboard
      </Link>
    </main>
  );
}
