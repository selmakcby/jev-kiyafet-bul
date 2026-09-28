// Jev sayı okumaz: fiyat üst sınırı ve beden koddan, regex ile çıkarılır.
import { sadelestir } from './urun';

const SAYI = String.raw`(\d+(?:[.,]\d+)*)`;
const CARPAN = String.raw`\s*(k|bin)?`;
const FIYAT_KALIPLARI: readonly RegExp[] = [
  new RegExp(`${SAYI}${CARPAN}\\s*(?:tl|lira|₺)`),
  new RegExp(`(?:₺|en fazla|en cok|maksimum|maks|max|butcem|butce)\\s*:?\\s*${SAYI}${CARPAN}`),
  new RegExp(`${SAYI}${CARPAN}\\s*(?:alti|altinda|ve alti|'?[ay]e? kadar|kadar)`),
];

function sayiCoz(ham: string, carpan: string | undefined): number | null {
  const binlikli = /^\d{1,3}(\.\d{3})+$/.test(ham);
  const temiz = binlikli ? ham.replace(/\./g, '') : ham.replace(/\.(?=\d{3}\b)/g, '').replace(',', '.');
  const deger = Number.parseFloat(temiz);
  if (!Number.isFinite(deger) || deger <= 0) return null;
  return Math.round(carpan ? deger * 1000 : deger);
}

/** "3000 TL altı", "3.000 tl", "2,5 bin lira", "en fazla 2500" → sayı; yoksa null. */
export function fiyatCikar(metin: string): number | null {
  const sade = sadelestir(metin);
  const bulunan = FIYAT_KALIPLARI.map((k) => sade.match(k))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => sayiCoz(m[1], m[2]))
    .filter((d): d is number => d !== null && d >= 50);
  return bulunan.length > 0 ? Math.min(...bulunan) : null;
}

const HARF_BEDEN = '(xxs|xs|s|m|l|xl|xxl|xxxl|[2-5]xl)';
const BEDEN_KALIPLARI: readonly RegExp[] = [
  new RegExp(`\\b${HARF_BEDEN}\\s*beden\\b`),
  new RegExp(`\\bbeden\\s*:?\\s*${HARF_BEDEN}\\b`),
  /\b(3[2-9]|4\d|5[0-4])\s*beden\b/,
  /\bbeden\s*:?\s*(3[2-9]|4\d|5[0-4])\b/,
  /\b(xxs|xs|xl|xxl|xxxl|[2-5]xl)\b/,
];

/** "M beden", "beden: 38", "XL" → "M" / "38" / "XL"; yoksa null. */
export function bedenCikar(metin: string): string | null {
  const sade = sadelestir(metin);
  const eslesme = BEDEN_KALIPLARI.map((k) => sade.match(k)).find((m) => m !== null);
  return eslesme ? eslesme[1].toUpperCase() : null;
}
