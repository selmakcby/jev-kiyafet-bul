'use client';
// Sağ panel: "Jev ne yapıyor" — her adım gerçek olay verisiyle dolar; altta ham JSON aç/kapa.
import type { ReactNode } from 'react';
import type { Olay, OlayHaritasi } from '@/lib/tipler';
import type { AramaDurumu } from './use-arama';
import { Adim1, Adim2, Adim3, Adim4, Adim5 } from './surec-adimlari';



const BASLIKLAR = ['İsteği okuyorum', 'Filtreleri çıkardım', 'Katalogdan daralttım', 'Adayları puanlıyorum', 'Sıraladım'] as const;

function HamJson({ veri }: { veri: unknown }) {
  return (
    <details className="mt-1 text-right leading-none">
      <summary className="inline cursor-pointer font-mono text-[11px] uppercase tracking-wider text-gri-3 hover:text-pembe">ham json</summary>
      <pre className="mt-2 max-h-64 overflow-auto border border-koyu-2 bg-black/40 p-3 text-left font-mono text-[11px] leading-relaxed text-gri-2">
        {JSON.stringify(veri, null, 2)}
      </pre>
    </details>
  );
}

type AdimKutusuOzellik = { no: number; olay?: Olay; tamam: boolean; aktif: boolean; children: ReactNode };

function AdimKutusu({ no, olay, tamam, aktif, children }: AdimKutusuOzellik) {
  return (
    <li className={`border-t border-koyu-2 py-2.5 transition-opacity duration-300 ${olay || aktif ? 'opacity-100' : 'opacity-30'}`}>
      <div className="mb-1.5 flex items-center gap-3 font-mono text-sm">
        <span className={`flex h-6 w-6 items-center justify-center text-xs ${tamam ? 'vurgu-gradyan text-white' : 'border border-gri-3/40 text-gri-3'}`}>{no}</span>
        <span className="text-zemin">{BASLIKLAR[no - 1]}</span>
        {aktif ? <span className="animate-pulse text-pembe">…</span> : null}
        {olay && 'atlandi' in olay ? <span className="text-gri-3">— atlandı</span> : null}
      </div>
      {olay ? children : null}
      {olay ? <HamJson veri={olay} /> : null}
    </li>
  );
}

export default function SurecPaneli({ olaylar, durum }: { olaylar: OlayHaritasi; durum: AramaDurumu['durum'] }) {
  const calisiyor = durum === 'yukleniyor';
  const tamam = (n: 1 | 2 | 3 | 4 | 5): boolean => Boolean(olaylar[n]) && (n !== 4 || Boolean(olaylar[5]));
  const aktif = (n: 1 | 2 | 3 | 4 | 5): boolean => calisiyor && !tamam(n) && (n === 1 || tamam((n - 1) as 1 | 2 | 3 | 4));
  return (
    <aside className="bg-koyu px-6 py-6 text-gri-2 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
      <h2 className="mb-3 font-mono text-sm uppercase tracking-widest text-gri-3">Jev ne yapıyor</h2>
      {durum === 'bos' ? <p className="font-mono text-sm text-gri-3">Bir arama yap; her adım burada canlı dolacak.</p> : null}
      {durum === 'bos' ? null : (
        <ol>
          {([1, 2, 3, 4, 5] as const).map((n) => (
            <AdimKutusu key={n} no={n} olay={olaylar[n]} tamam={tamam(n)} aktif={aktif(n)}>
              {n === 1 ? <Adim1 olay={olaylar[1]} /> : null}
              {n === 2 ? <Adim2 olay={olaylar[2]} /> : null}
              {n === 3 ? <Adim3 olay={olaylar[3]} /> : null}
              {n === 4 ? <Adim4 olay={olaylar[4]} /> : null}
              {n === 5 ? <Adim5 olay={olaylar[5]} /> : null}
            </AdimKutusu>
          ))}
        </ol>
      )}
    </aside>
  );
}
