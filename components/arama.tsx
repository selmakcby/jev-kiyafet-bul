'use client';
// Sayfa iskeleti: solda arama + sonuçlar (2/3), sağda "Jev ne yapıyor" paneli (1/3).
import AnlamaKarti from './anlama-karti';
import AramaKutusu from './arama-kutusu';
import SurecPaneli from './surec-paneli';
import UrunKarti from './urun-karti';
import { useArama } from './use-arama';

function AltSatir({ sureMs, token, maliyetUsd, ornekMod }: { sureMs: number; token: number; maliyetUsd: number; ornekMod: boolean }) {
  return (
    <p className="mt-8 border-t border-gri-1 pt-3 font-mono text-sm text-soluk">
      {(sureMs / 1000).toFixed(2)} sn · {token.toLocaleString('tr-TR')} token · ${maliyetUsd.toFixed(5)}
      {ornekMod ? ' · örnek mod (sahte Jev)' : ''}
    </p>
  );
}

export default function Arama() {
  const { durum, olaylar, veri, hata, ara } = useArama();
  const yukleniyor = durum === 'yukleniyor';
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-3">
      <main className="px-6 py-10 lg:col-span-2 lg:px-12">
        <header className="mb-8 flex items-baseline justify-between">
          <h1 className="font-mono text-lg font-semibold tracking-tight">kıyafet-bul</h1>
          <span className="font-mono text-sm text-soluk">dış giyim + kazak/hırka · Trendyol kataloğu</span>
        </header>
        <AramaKutusu yukleniyor={yukleniyor} onAra={ara} />
        {hata ? <p className="mt-6 border border-magenta/40 bg-pembe/10 px-4 py-3 text-base">{hata}</p> : null}
        {veri ? <AnlamaKarti filtreler={veri.filtreler} /> : null}
        {yukleniyor && !veri ? <p className="mt-10 font-mono text-base text-soluk">Jev düşünüyor…</p> : null}
        {veri?.mesaj ? (
          <p className="mt-10 border-l-4 border-magenta bg-pembe/10 px-5 py-4 text-xl">{veri.mesaj}</p>
        ) : null}
        {veri && !veri.kapsamDisi ? (
          <>
            <h2 className="mt-10 mb-4 font-mono text-sm uppercase tracking-widest text-soluk">
              {veri.sonuclar.length} sonuç · {veri.adaySayisi} aday puanlandı
            </h2>
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
              {veri.sonuclar.map((k) => <UrunKarti key={k.id} kart={k} />)}
            </div>
            <AltSatir sureMs={veri.sureMs} token={veri.token} maliyetUsd={veri.maliyetUsd} ornekMod={veri.ornekMod} />
          </>
        ) : null}
      </main>
      <SurecPaneli olaylar={olaylar} durum={durum} />
    </div>
  );
}
