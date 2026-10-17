'use client';

import { Check, Download, Link2 } from 'lucide-react';
import { useState } from 'react';

const buttonClass =
  'inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold shadow-lg shadow-black/20 transition-colors';

export function ShareActions({ uid, nickname }: { uid: string; nickname: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/${uid}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link', `${window.location.origin}/${uid}`);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`/${uid}/card?download=1`}
        download={`${nickname}-noelle.png`}
        className={`${buttonClass} bg-amber-400 text-ink hover:bg-amber-300`}
      >
        <Download className="h-4 w-4" aria-hidden />
        Download card
      </a>
      <button type="button" onClick={copyLink} className={`${buttonClass} bg-ink text-stone-100 hover:bg-black`}>
        {copied ? <Check className="h-4 w-4" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />}
        {copied ? 'Link copied' : 'Copy link'}
      </button>
    </div>
  );
}
