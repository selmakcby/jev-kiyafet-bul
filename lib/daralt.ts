// Adım 3 (kod): katalogu filtrelerle daraltır. Çok az aday kalırsa en az güvenli filtreyi gevşetir;
// tam eşleşenler yine en öne konur, gerisi esnek adaylarla doldurulur.
import type { Filtre, FiltreAdi } from './filtre';
import { DIS_GIYIM, sadelestir, TRIKO, type Urun } from './urun';

export const MIN_ADAY = 12;
export const MAKS_ADAY = 60;

type Kural = (u: Urun, f: Filtre) => boolean;
const KURALLAR: Readonly<Record<FiltreAdi, Kural>> = {
  kapsam: (u, f) => (f.deger === 'kazak_hirka' ? TRIKO : f.deger === 'dis_giyim' ? DIS_GIYIM : [...DIS_GIYIM, ...TRIKO]).includes(u.kategori),
  tur: (u, f) => u.kategori === f.deger,
  // Boyu ya da bedeni bilinmeyen ürün elenmez; kazakta boy anlamsız, uygulanmaz. Jev puanlamada karar verir.
  uzunluk: (u, f) => u.kategori === 'kazak' || u.uzunluk === null || u.uzunluk === f.deger,
  renk: (u, f) => u.renkler.some((r) => sadelestir(r) === f.deger),
  kemerli: (u) => u.kemerli,
  kapusonlu: (u) => u.kapusonlu,
  su_gecirmez: (u) => u.su_gecirmez,
  butce: (u, f) => typeof f.deger === 'number' && u.fiyat <= f.deger,
  beden: (u, f) => u.bedenler.length === 0 || u.bedenler.includes(String(f.deger)),
};

export function filtreUygula(urunler: readonly Urun[], filtreler: readonly Filtre[]): readonly Urun[] {
  const aktif = filtreler.filter((f) => f.durum === 'uygulandi');
  return urunler.filter((u) => aktif.every((f) => KURALLAR[f.ad](u, f)));
}

/** Gevşetme sırası: önce düşük güvenli Jev filtreleri; tür ve bütçe sonra, kapsam en son. */
function gevsetilecek(filtreler: readonly Filtre[]): Filtre | undefined {
  const agirlik = (f: Filtre) => (f.ad === 'kapsam' ? 20 : f.ad === 'tur' || f.ad === 'butce' ? 10 : 0) + (f.guven ?? 1);
  return [...filtreler.filter((f) => f.durum === 'uygulandi')].sort((a, b) => agirlik(a) - agirlik(b))[0];
}

function gevset(urunler: readonly Urun[], filtreler: readonly Filtre[]): readonly Filtre[] {
  if (filtreUygula(urunler, filtreler).length >= MIN_ADAY) return filtreler;
  const hedef = gevsetilecek(filtreler);
  if (!hedef) return filtreler;
  const yeni = filtreler.map((f) =>
    f === hedef ? { ...f, durum: 'gevsetildi' as const, not: 'Tam eşleşen az; tam eşleşenler önde, gerisi esnek' } : f,
  );
  return gevset(urunler, yeni);
}

const kelimeler = (metin: string) => sadelestir(metin).split(/[^a-z0-9]+/).filter((k) => k.length >= 3);

/** İstekle kelime örtüşmesi: 60 aday sınırına kesmeden önce kaba ön sıralama. */
function ortusme(istek: readonly string[], u: Urun): number {
  const urunKelimeleri = new Set(kelimeler(`${u.ad} ${u.aciklama} ${u.renkler.join(' ')}`));
  return istek.filter((k) => urunKelimeleri.has(k)).length;
}

export type DaraltmaSonucu = Readonly<{
  adaylar: readonly Urun[];
  filtreler: readonly Filtre[];
  eslesen: number;
  tamEslesen: number;
}>;

export function katalogDaralt(urunler: readonly Urun[], filtreler: readonly Filtre[], metin: string): DaraltmaSonucu {
  const son = gevset(urunler, filtreler);
  const tam = new Set(filtreUygula(urunler, filtreler).map((u) => u.id));
  const eslesen = filtreUygula(urunler, son);
  const istek = kelimeler(metin);
  const adaylar = [...eslesen]
    .map((u, i) => ({ u, tam: tam.has(u.id) ? 1 : 0, puan: ortusme(istek, u), i }))
    .sort((a, b) => b.tam - a.tam || b.puan - a.puan || a.i - b.i)
    .slice(0, MAKS_ADAY)
    .map(({ u }) => u);
  return { adaylar, filtreler: son, eslesen: eslesen.length, tamEslesen: tam.size };
}
