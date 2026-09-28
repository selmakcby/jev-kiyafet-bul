'use client';
import { useState } from 'react';

const ORNEKLER = [
  'uzun bej trench, kemerli, M beden, 3000 TL altı',
  'yağmurda ıslanmayan kapüşonlu siyah mont',
  'ofise giyilecek kahverengi kaban, 2500 liraya kadar',
] as const;

export default function AramaKutusu({ yukleniyor, onAra }: { yukleniyor: boolean; onAra: (metin: string) => void }) {
  const [metin, setMetin] = useState('');
  const gonder = (m: string) => {
    const temiz = m.trim();
    if (temiz.length >= 3) onAra(temiz);
  };
  return (
    <section>
      <form
        className="flex border border-koyu"
        onSubmit={(e) => {
          e.preventDefault();
          gonder(metin);
        }}
      >
        <input
          value={metin}
          onChange={(e) => setMetin(e.target.value)}
          maxLength={300}
          placeholder="Ne arıyorsun? ör. uzun bej trench, kemerli, 3000 TL altı"
          aria-label="Aradığın kıyafeti yaz"
          className="min-w-0 flex-1 bg-transparent px-5 py-4 text-2xl outline-none placeholder:text-gri-3"
        />
        <button
          type="submit"
          disabled={yukleniyor}
          className="bg-koyu px-8 font-mono text-lg text-zemin transition-opacity disabled:opacity-50"
        >
          {yukleniyor ? 'arıyor…' : 'ara'}
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {ORNEKLER.map((o) => (
          <button
            key={o}
            type="button"
            disabled={yukleniyor}
            onClick={() => {
              setMetin(o);
              gonder(o);
            }}
            className="border border-gri-2 px-3 py-1.5 font-mono text-sm text-soluk hover:border-koyu hover:text-koyu disabled:opacity-50"
          >
            {o}
          </button>
        ))}
      </div>
    </section>
  );
}
