import UidForm from '@/components/UidForm';
import LeaderboardTable from '@/components/LeaderboardTable';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <header className="max-w-5xl mx-auto mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-200 to-yellow-600 mb-4">
          Noelle Mains Leaderboard
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Sistema de classificação especializado para builds da Noelle com simulação avançada de cenários e equipas no meta atual.
        </p>
      </header>

      <UidForm />
      <LeaderboardTable />
    </main>
  );
}