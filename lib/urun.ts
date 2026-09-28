// Katalog ürün şeması (data/katalog.json). scripts/katalog-cek.mjs üretir.
import { z } from 'zod';

export const TURLER = ['ceket', 'mont', 'trenckot', 'kaban', 'blazer', 'kazak', 'hirka'] as const;
export const DIS_GIYIM: readonly string[] = ['ceket', 'mont', 'trenckot', 'kaban', 'blazer'];
export const TRIKO: readonly string[] = ['kazak', 'hirka'];
export const UZUNLUKLAR = ['kisa', 'orta', 'uzun'] as const;

export const UrunSema = z.object({
  id: z.string(),
  ad: z.string(),
  marka: z.string(),
  kategori: z.enum(TURLER),
  fiyat: z.number().positive(),
  para_birimi: z.string(),
  renkler: z.array(z.string()),
  bedenler: z.array(z.string()),
  aciklama: z.string(),
  url: z.string().url().startsWith('https://'),
  gorsel_url: z.string().url().startsWith('https://'),
  uzunluk: z.enum(UZUNLUKLAR).nullable(),
  kemerli: z.boolean(),
  kapusonlu: z.boolean(),
  su_gecirmez: z.boolean(),
});

export type Urun = z.infer<typeof UrunSema>;
export const KatalogSema = z.array(UrunSema);

/** Türkçe karakterleri ASCII'ye indirip küçük harfe çevirir (anahtar ve eşleştirme için). */
export function sadelestir(metin: string): string {
  const harita: Record<string, string> = { ı: 'i', İ: 'i', ş: 's', Ş: 's', ğ: 'g', Ğ: 'g', ü: 'u', Ü: 'u', ö: 'o', Ö: 'o', ç: 'c', Ç: 'c' };
  return metin
    .replace(/[ıİşŞğĞüÜöÖçÇ]/g, (h) => harita[h])
    .toLowerCase()
    .trim();
}
