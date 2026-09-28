// Küçük ortak parçalar: yüzde, olasılık çubuğu, durum etiketi.
import type { Filtre } from '@/lib/tipler';

export const yuzde = (x: number) => `%${Math.round(x * 100)}`;

export function OlasilikCubugu({ deger, koyu = false }: { deger: number; koyu?: boolean }) {
  return (
    <span className={`block h-1 w-full ${koyu ? 'bg-koyu-2' : 'bg-gri-1'}`}>
      <span className="vurgu-gradyan block h-full" style={{ width: `${Math.round(Math.min(1, Math.max(0, deger)) * 100)}%` }} />
    </span>
  );
}

const DURUM_METNI: Readonly<Record<Filtre['durum'], string | null>> = {
  uygulandi: null,
  atlandi: 'atlandı',
  belirtilmedi: 'yok',
  gevsetildi: 'esnek',
};

export function DurumEtiketi({ durum }: { durum: Filtre['durum'] }) {
  const metin = DURUM_METNI[durum];
  return metin ? <span className="border border-current px-1.5 py-0.5 font-mono text-[11px] uppercase">{metin}</span> : null;
}

export function KoddanRozeti() {
  return <span className="border border-pembe px-1.5 py-0.5 font-mono text-[11px] uppercase text-magenta">koddan</span>;
}
