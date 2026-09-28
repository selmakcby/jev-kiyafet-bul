// "Seni böyle anladım": Jev'in çıkardığı filtreler + güven. Uygulanmayanlar soluk.
import type { Filtre } from '@/lib/tipler';
import { DurumEtiketi, KoddanRozeti, OlasilikCubugu, yuzde } from './rozetler';

function FiltreSatiri({ f }: { f: Filtre }) {
  const soluk = f.durum === 'atlandi' || f.durum === 'belirtilmedi';
  const esnek = f.durum === 'gevsetildi';
  return (
    <li className={`flex flex-col gap-1.5 border p-3 ${esnek ? 'border-dashed border-pembe' : 'border-gri-1'} ${soluk ? 'opacity-40' : ''}`} title={f.not}>
      <div className="flex items-center justify-between gap-2 font-mono text-xs uppercase tracking-wider text-soluk">
        <span>{f.etiket}</span>
        <span className="flex gap-1">
          {f.kaynak === 'kod' ? <KoddanRozeti /> : null}
          <DurumEtiketi durum={f.durum} />
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-lg font-medium">{f.gorunen}</span>
        {f.guven !== null ? <span className="font-mono text-sm text-soluk">{yuzde(f.guven)}</span> : null}
      </div>
      {f.guven !== null ? <OlasilikCubugu deger={f.guven} /> : <span className="h-1.5" />}
    </li>
  );
}

export default function AnlamaKarti({ filtreler }: { filtreler: readonly Filtre[] }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 font-mono text-sm uppercase tracking-widest text-soluk">Seni böyle anladım</h2>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {filtreler.map((f) => <FiltreSatiri key={f.ad} f={f} />)}
      </ul>
    </section>
  );
}
