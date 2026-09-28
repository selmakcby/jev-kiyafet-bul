// data/ham.json (Apify, Trendyol: dış giyim + kazak/hırka) → data/katalog.json. Ham veri yoksa önce: npm run katalog:ham
import fs from 'node:fs';

const HAM = new URL('../data/ham.json', import.meta.url);
const KATALOG = new URL('../data/katalog.json', import.meta.url);
const ACIKLAMA_ANAHTARLARI = [
  'Kalıp', 'Materyal', 'Kumaş Tipi', 'Boy', 'Siluet', 'Kemer/Kuşak Durumu', 'Yaka Tipi', 'Kapama Şekli',
  'Ek Özellik', 'Kalınlık', 'Astar Durumu', 'Dolgu Materyali', 'Teknik', 'Ürün Detayı', 'Sezon',
];
const UZUN_BOY = ['Uzun', 'Maxi', 'Midi', 'Bilek Boy'];
const KISA_BOY = ['Kısa', 'Mini', 'Kısa / Mini', 'Crop'];

const BASLIK_RENKLERI = ['Siyah', 'Lacivert', 'Haki', 'Kahverengi', 'Gri', 'Krem', 'Kırmızı', 'Bej', 'Bordo', 'Mor', 'Beyaz', 'Ekru', 'Pembe', 'Yeşil', 'Vizon', 'Mavi'];
const kucuk = (s) => s.toLocaleLowerCase('tr-TR');

/** Nitelikte renk yoksa başlıktan (ör. "Dik Yaka Kemerli Kahverengi Trençkot"). */
function renkBul(h, n) {
  const dogrudan = n.Renk ?? h.details?.additional?.slicing_attributes?.dsm_color;
  if (dogrudan) return [dogrudan];
  const ad = kucuk(h.title ?? '');
  const bulunan = BASLIK_RENKLERI.find((r) => ad.includes(kucuk(r))) ?? (ad.includes('kahve') ? 'Kahverengi' : undefined);
  return bulunan ? [bulunan] : [];
}
const nitelikler = (h) => Object.fromEntries((h.attributes?.items ?? []).map((a) => [a.key.name, a.value.name]));

function kategoriBul(h) {
  const kat = kucuk(h.category?.name ?? '');
  const ad = kucuk(h.title ?? '');
  if (kat.includes('hırka')) return 'hirka';
  if (kat.includes('kazak') || kat.includes('süveter') || kat.includes('triko')) return 'kazak';
  if (ad.includes('blazer')) return 'blazer';
  if (kat.includes('trençkot') || ad.includes('trenç') || ad.includes('trench')) return 'trenckot';
  if (kat.includes('kaban') || ad.includes('palto')) return 'kaban';
  if (kat.includes('mont')) return 'mont';
  if (kat.includes('ceket')) return 'ceket';
  return null;
}

function uzunlukBul(boy, ad) {
  if (UZUN_BOY.includes(boy) || /\b(uzun|maxi|midi)\b/.test(ad)) return 'uzun';
  if (KISA_BOY.includes(boy) || /\b(kısa|crop|mini)\b/.test(ad)) return 'kisa';
  if (boy === 'Orta') return 'orta';
  return null;
}

function aciklamaKur(n) {
  return ACIKLAMA_ANAHTARLARI.filter((k) => n[k] && !/belirtilmemiş|mevcut değil|^yok$/i.test(n[k]))
    .map((k) => `${k}: ${n[k]}`)
    .join('. ');
}

function donustur(h) {
  const n = nitelikler(h);
  const ad = kucuk(h.title ?? '');
  const metin = kucuk(`${h.title} ${Object.values(n).join(' ')}`);
  return {
    id: String(h.id),
    ad: h.title,
    marka: h.brand?.name ?? '',
    kategori: kategoriBul(h),
    fiyat: h.pricing?.current_price ?? h.pricing?.price?.discounted_price?.value,
    para_birimi: ['TL', 'TRY'].includes(h.pricing?.currency ?? 'TRY') ? 'TRY' : h.pricing.currency,
    renkler: renkBul(h, n),
    // Liste verisi sadece "kazanan" varyantın tek bedenini veriyor; stok listesi değil. Yanıltmasın diye boş
    // bırakılır; bedeni bilinmeyen ürün filtrede elenmez (README: bilinen eksik).
    bedenler: [],
    aciklama: aciklamaKur(n),
    url: h.url,
    gorsel_url: h.media?.primary_image ?? h.media?.images?.[0],
    uzunluk: uzunlukBul(n.Boy, ad),
    kemerli: ['Kemerli', 'Kuşaklı'].includes(n['Kemer/Kuşak Durumu']) || /kemerli|kuşaklı|kemer detay/.test(ad),
    kapusonlu: /kapüşon|kapşon/.test(metin),
    su_gecirmez: /su itici|su geçirmez|suya dayanıklı|yağmurluk/.test(metin),
  };
}

const gecerli = (u) => u.kategori && Number.isFinite(u.fiyat) && u.fiyat > 0 && u.url && u.gorsel_url && u.ad;

if (!fs.existsSync(HAM)) {
  process.stderr.write('data/ham.json yok. Önce: npm run katalog:ham\n');
  process.exit(1);
}
const ham = JSON.parse(fs.readFileSync(HAM, 'utf8'));
const katalog = ham.filter((h) => h.type === 'product' && h.availability?.in_stock !== false).map(donustur).filter(gecerli);
fs.writeFileSync(KATALOG, `${JSON.stringify(katalog, null, 1)}\n`);
const dagilim = katalog.reduce((acc, u) => ({ ...acc, [u.kategori]: (acc[u.kategori] ?? 0) + 1 }), {});
process.stdout.write(`${katalog.length} ürün → data/katalog.json ${JSON.stringify(dagilim)}\n`);
