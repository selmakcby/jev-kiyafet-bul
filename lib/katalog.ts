// Katalog yükleyici: JSON bir kere okunur, Zod ile doğrulanır.
import veri from '@/data/katalog.json';
import { KatalogSema, sadelestir, type Urun } from './urun';

let katalog: readonly Urun[] | null = null;

export function katalogAl(): readonly Urun[] {
  katalog = katalog ?? KatalogSema.parse(veri);
  return katalog;
}

/** Katalogdaki en sık N renk (sadeleştirilmiş anahtar → görünen ad). */
export function sikRenkler(urunler: readonly Urun[], n = 8): readonly { anahtar: string; ad: string }[] {
  const sayac = urunler
    .flatMap((u) => u.renkler)
    .reduce<ReadonlyMap<string, { ad: string; adet: number }>>((acc, renk) => {
      const anahtar = sadelestir(renk);
      const onceki = acc.get(anahtar);
      return new Map(acc).set(anahtar, { ad: onceki?.ad ?? renk, adet: (onceki?.adet ?? 0) + 1 });
    }, new Map());
  return [...sayac.entries()]
    .sort((a, b) => b[1].adet - a[1].adet)
    .slice(0, n)
    .map(([anahtar, { ad }]) => ({ anahtar, ad }));
}
