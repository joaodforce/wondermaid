'use client';

import { useState, useEffect } from 'react';

interface LeaderboardEntry {
  uid: string;
  nickname: string;
  finalDamage: number;
  updatedAt: string;
  weaponId: number;
  weaponRefinement: number;
}

const SCENARIOS = [
  { id: 'mono-geo-c6-gorou', name: 'Mono Geo (Gorou C6)' },
  { id: 'furina-hyper', name: 'Furina Hypercarry' },
  { id: 'plunge-xianyun', name: 'Plunge (Xianyun)' },
];

export default function LeaderboardTable() {
  const [selectedScenario, setSelectedScenario] = useState('mono-geo-c6-gorou');
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?scenarioId=${selectedScenario}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error('Erro ao carregar leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [selectedScenario]);

  return (
    <div className="w-full max-w-5xl mx-auto my-8">
      {/* Tabs de Cenário */}
      <div className="flex border-b border-slate-800 mb-6 gap-2">
        {SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => setSelectedScenario(scenario.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              selectedScenario === scenario.id
                ? 'border-yellow-500 text-yellow-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {scenario.name}
          </button>
        ))}
      </div>

      {/* Tabela de Classificação */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-8 text-center text-slate-400">A carregar dados da classificação...</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Nenhum registo encontrado para este cenário.</div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4"># Rank</th>
                <th className="px-6 py-4">Jogador</th>
                <th className="px-6 py-4">UID</th>
                <th className="px-6 py-4 text-right">Dano Estimado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data.map((entry, index) => (
                <tr key={entry.uid} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-100">
                    {index === 0 && <span className="text-yellow-400">🥇 1</span>}
                    {index === 1 && <span className="text-slate-300">🥈 2</span>}
                    {index === 2 && <span className="text-amber-600">🥉 3</span>}
                    {index > 2 && index + 1}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-100">{entry.nickname}</td>
                  <td className="px-6 py-4 text-slate-400 font-mono">{entry.uid}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-yellow-400 text-base">
                    {Math.round(entry.finalDamage).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}