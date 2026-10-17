'use client';

import { useState, useTransition } from 'react';
import { processPlayerUpdate } from '@/app/actions/updatePlayer';

export default function UidForm() {
  const [uid, setUid] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!uid || uid.length < 8) {
      setMessage({ type: 'error', text: 'Por favor, insira um UID válido.' });
      return;
    }

    startTransition(async () => {
      const res = await processPlayerUpdate(uid);
      if (res.success) {
        setMessage({ type: 'success', text: res.message || 'Atualizado com sucesso!' });
        setUid('');
      } else {
        setMessage({ type: 'error', text: res.error || 'Erro ao processar o UID.' });
      }
    });
  };

  return (
    <div className="w-full max-w-xl mx-auto my-8 p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
      <h2 className="text-xl font-bold text-slate-100 mb-2 text-center">Atualizar Noelle no Leaderboard</h2>
      <p className="text-sm text-slate-400 mb-6 text-center">
        Insere o teu UID do Genshin Impact. Certifica-te de que os detalhes da personagem estão visíveis no teu perfil do jogo.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          placeholder="Ex: 700123456"
          value={uid}
          onChange={(e) => setUid(e.target.value)}
          disabled={isPending}
          className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          {isPending ? 'A carregar...' : 'Atualizar'}
        </button>
      </form>

      {message && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
              : 'bg-rose-950/80 text-rose-400 border border-rose-800'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}