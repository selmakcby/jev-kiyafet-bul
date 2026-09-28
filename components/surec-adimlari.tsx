// Süreç panelinin adım içerikleri (koyu zemin).
import type { Olay } from '@/lib/tipler';
import { DurumEtiketi, KoddanRozeti, OlasilikCubugu, yuzde } from './rozetler';

type AdimOlayi<N extends Olay['adim']> = Extract<Olay, { adim: N }>;
function Atlandi({ sebep }: { sebep: string }) {
  return <p className="font-mono text-xs text-gri-3"><span className="mr-2 border border-current px-1.5 py-0.5 uppercase">atlandı</span>{sebep}</p>;
}

const Sayi = ({ children }: { children: React.ReactNode }) => <span className="font-mono text-zemin">{children}</span>;

export function Adim1({ olay }: { olay?: AdimOlayi<1> }) {
  if (!olay) return null;
  return (
    <div className="space-y-1 text-sm">
      <p className="border-l-2 border-pembe pl-3 text-base text-zemin">“{olay.state}”</p>
      <p className="font-mono text-xs text-gri-3">
        {olay.sorular.length} soru, tek çağrı: {olay.sorular.map((s) => `${s.ad}:${s.tip}`).join(' · ')}
      </p>
    </div>
  );
}

export function Adim2({ olay }: { olay?: AdimOlayi<2> }) {
  if (!olay) return null;
  return (
    <ul className="space-y-1">
      {olay.filtreler.map((f) => (
        <li key={f.ad} className={f.durum === 'uygulandi' ? '' : f.durum === 'gevsetildi' ? 'opacity-70' : 'opacity-40'}>
          <div className="mb-0.5 flex items-center justify-between gap-2 font-mono text-sm">
            <span className="text-gri-3">{f.ad}</span>
            <span className="flex items-center gap-1.5 text-zemin">
              {f.gorunen}
              {f.kaynak === 'kod' ? <KoddanRozeti /> : null}
              <DurumEtiketi durum={f.durum} />
              {f.guven !== null ? <span className="w-10 text-right text-gri-3">{yuzde(f.guven)}</span> : null}
            </span>
          </div>
          {f.guven !== null ? <OlasilikCubugu deger={f.guven} koyu /> : null}
          {f.ad === 'kapsam' && f.olasiliklar ? (
            <p className="mt-0.5 font-mono text-[11px] text-gri-3">
              {Object.entries(f.olasiliklar).sort((a, b) => b[1] - a[1]).map(([k, p]) => `${k} ${yuzde(p)}`).join(' · ')}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function Adim3({ olay }: { olay?: AdimOlayi<3> }) {
  if (!olay) return null;
  if ('atlandi' in olay) return <Atlandi sebep={olay.sebep} />;
  return (
    <div className="space-y-1 text-sm">
      <p className="font-mono text-2xl text-zemin">
        {olay.katalog} <span className="text-gri-3">ürün →</span> {olay.aday} <span className="text-gri-3">aday</span>
      </p>
      <p className="font-mono text-xs text-gri-3">
        kod: {olay.uygulanan.length ? olay.uygulanan.join(', ') : 'filtre yok'} · tam eşleşen {olay.tamEslesen}
        {olay.gevsetilen.length ? ` · esnek: ${olay.gevsetilen.join(', ')} (${olay.eslesen} ürün)` : ''}
      </p>
    </div>
  );
}

export function Adim4({ olay }: { olay?: AdimOlayi<4> }) {
  if (!olay) return null;
  if ('atlandi' in olay) return <Atlandi sebep={olay.sebep} />;
  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-3">
        <span className="font-mono text-zemin">{olay.tamamlanan}/{olay.toplam}</span>
        <OlasilikCubugu deger={olay.toplam ? olay.tamamlanan / olay.toplam : 0} koyu />
      </div>
      <ol className="space-y-1">
        {olay.enIyi.map((k, i) => (
          <li key={k.id} className="flex items-baseline justify-between gap-3">
            <span className="line-clamp-1 text-gri-2">{i + 1}. {k.ad}</span>
            <span className="shrink-0 font-mono text-xs text-pembe">{k.uyumEtiketi} %{k.uyumYuzde}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Adim5({ olay }: { olay?: AdimOlayi<5> }) {
  if (!olay) return null;
  if ('atlandi' in olay) return <Atlandi sebep={olay.sebep} />;
  const hucreler = [
    ['süre', `${(olay.sureMs / 1000).toFixed(2)} sn`],
    ['token', olay.token.toLocaleString('tr-TR')],
    ['maliyet', `$${olay.maliyetUsd.toFixed(5)}`],
    ['jev çağrısı', String(olay.cagri)],
  ] as const;
  return (
    <dl className="grid grid-cols-2 gap-3">
      {hucreler.map(([ad, deger]) => (
        <div key={ad} className="border border-koyu-2 px-2.5 py-1.5">
          <dt className="font-mono text-[11px] uppercase tracking-wider text-gri-3">{ad}</dt>
          <dd className="font-mono text-lg"><Sayi>{deger}</Sayi></dd>
        </div>
      ))}
    </dl>
  );
}
