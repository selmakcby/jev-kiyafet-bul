import { describe, expect, it } from 'vitest';
import { aramaYap } from '@/lib/ara';
import { katalogDaralt, MIN_ADAY } from '@/lib/daralt';
import { GUVEN_ESIGI, istegiYapilandir } from '@/lib/filtre';
import { bedenCikar, fiyatCikar } from '@/lib/regex';
import { adimBirJev, puanJev, urun } from './yardimci';

const RENKLER = [{ anahtar: 'bej', ad: 'Bej' }, { anahtar: 'siyah', ad: 'Siyah' }];
const bul = (fs: Awaited<ReturnType<typeof istegiYapilandir>>['filtreler'], ad: string) => fs.find((f) => f.ad === ad)!;

describe('regex: fiyat', () => {
  it.each([
    ['uzun bej trench, kemerli, M beden, 3000 TL altı', 3000],
    ['3.000 tl', 3000],
    ['2,5 bin lira', 2500],
    ['en fazla 2500', 2500],
    ['bütçem 4k', 4000],
    ['kaban 1500 liraya kadar', 1500],
    ['2000 altı', 2000],
  ])('%s → %d', (metin, beklenen) => expect(fiyatCikar(metin)).toBe(beklenen));

  it('fiyat yoksa ya da sayı bedense null', () => {
    expect(fiyatCikar('kemerli trençkot')).toBeNull();
    expect(fiyatCikar('siyah mont 38 beden')).toBeNull();
  });
});

describe('regex: beden', () => {
  it.each([
    ['M beden trençkot', 'M'],
    ['beden: 38', '38'],
    ['XL kaban', 'XL'],
    ['siyah mont 40 beden', '40'],
  ])('%s → %s', (metin, beklenen) => expect(bedenCikar(metin)).toBe(beklenen));

  it('beden yoksa null; tek başına "m" harfi beden sayılmaz', () => {
    expect(bedenCikar('uzun bej trench')).toBeNull();
    expect(bedenCikar('bir m kumaş')).toBeNull();
  });
});

describe('istegiYapilandir', () => {
  it(`güveni ${GUVEN_ESIGI} altındaki choice filtresi atlanır, üstündeki uygulanır`, async () => {
    const jev = adimBirJev({ tur: ['trenckot', 0.3], renk: ['bej', 0.9] });
    const { filtreler } = await istegiYapilandir('bej trençkot', RENKLER, jev);
    expect(bul(filtreler, 'tur').durum).toBe('atlandi');
    expect(bul(filtreler, 'renk').durum).toBe('uygulandi');
    expect(bul(filtreler, 'renk').gorunen).toBe('Bej');
  });

  it('farketmez seçilirse filtre "belirtilmedi" olur', async () => {
    const { filtreler } = await istegiYapilandir('bir şey', RENKLER, adimBirJev({}));
    expect(bul(filtreler, 'uzunluk').durum).toBe('belirtilmedi');
  });

  it('bütçe: fiyatı regex çıkarır, Jev emin değilse atlanır', async () => {
    const emin = await istegiYapilandir('trench 3000 TL altı', RENKLER, adimBirJev({ butce_var: 0.95 }));
    expect(bul(emin.filtreler, 'butce')).toMatchObject({ deger: 3000, durum: 'uygulandi', kaynak: 'kod' });
    const eminDegil = await istegiYapilandir('trench 3000 TL altı', RENKLER, adimBirJev({ butce_var: 0.2 }));
    expect(bul(eminDegil.filtreler, 'butce').durum).toBe('atlandi');
  });

  it('beden regex ile gelir ve kod kaynaklıdır; noul düşükse istenmedi', async () => {
    const { filtreler } = await istegiYapilandir('M beden trench', RENKLER, adimBirJev({ kemerli: 0.2 }));
    expect(bul(filtreler, 'beden')).toMatchObject({ deger: 'M', kaynak: 'kod', durum: 'uygulandi' });
    expect(bul(filtreler, 'kemerli').durum).toBe('belirtilmedi');
  });
});

describe('katalogDaralt', () => {
  const katalog = [
    ...Array.from({ length: 15 }, (_, i) => urun({ id: `t${i}`, kategori: 'trenckot', renkler: ['Bej'] })),
    ...Array.from({ length: 15 }, (_, i) => urun({ id: `m${i}`, kategori: 'mont', renkler: ['Siyah'], fiyat: 5000 })),
  ];

  it('uygulanan filtrelerle daraltır', async () => {
    const { filtreler } = await istegiYapilandir('bej trençkot', RENKLER, adimBirJev({ tur: ['trenckot', 0.9], renk: ['bej', 0.8] }));
    const s = katalogDaralt(katalog, filtreler, 'bej trençkot');
    expect(s.adaylar).toHaveLength(15);
    expect(s.adaylar.every((u) => u.kategori === 'trenckot')).toBe(true);
  });

  it(`${MIN_ADAY} adaydan az kalırsa en az güvenli filtre gevşetilir`, async () => {
    const { filtreler } = await istegiYapilandir('siyah trençkot', RENKLER, adimBirJev({ tur: ['trenckot', 0.9], renk: ['siyah', 0.6] }));
    const s = katalogDaralt(katalog, filtreler, 'siyah trençkot');
    expect(s.filtreler.find((f) => f.ad === 'renk')?.durum).toBe('gevsetildi');
    expect(s.filtreler.find((f) => f.ad === 'tur')?.durum).toBe('uygulandi');
    expect(s.adaylar).toHaveLength(15);
  });

  it('gevşetmede tam eşleşenler adayların en önünde kalır', async () => {
    const karisik = [...katalog, urun({ id: 'ts1', kategori: 'trenckot', renkler: ['Siyah'] }), urun({ id: 'ts2', kategori: 'trenckot', renkler: ['Siyah'] })];
    const { filtreler } = await istegiYapilandir('siyah trençkot', RENKLER, adimBirJev({ tur: ['trenckot', 0.9], renk: ['siyah', 0.6] }));
    const s = katalogDaralt(karisik, filtreler, 'siyah trençkot');
    expect(s.tamEslesen).toBe(2);
    expect(s.adaylar.slice(0, 2).map((u) => u.id).sort()).toEqual(['ts1', 'ts2']);
  });
});

describe('kapsam kapısı', () => {
  const katalog = [
    ...Array.from({ length: 14 }, (_, i) => urun({ id: `t${i}`, kategori: 'trenckot' })),
    ...Array.from({ length: 14 }, (_, i) => urun({ id: `k${i}`, kategori: 'kazak', uzunluk: 'kisa' })),
  ];

  it('katalog dışı + güven ≥ 0,5: puanlamaya geçmez, boş sonuç ve mesaj, 3–5 atlanır', async () => {
    const olaylar: unknown[] = [];
    const cagrilar: unknown[] = [];
    const jev = adimBirJev({ kapsam: ['katalog_disi', 0.95] });
    const sayanJev: typeof jev = async (s, q) => (cagrilar.push(s), jev(s, q));
    const v = await aramaYap('mayo', { karar: sayanJev, katalog, bildir: (o) => olaylar.push(o) });
    expect(v).toMatchObject({ kapsamDisi: true, sonuclar: [], cagri: 1, mesaj: "Bu katalogda sadece dış giyim ve kazak var; 'mayo' kapsam dışı." });
    expect(cagrilar).toHaveLength(1);
    expect(olaylar.filter((o) => (o as { atlandi?: boolean }).atlandi)).toHaveLength(3);
  });

  it('katalog dışı ama güven düşükse kapı kapanmaz', async () => {
    const bir = adimBirJev({ kapsam: ['katalog_disi', 0.3] });
    const iki = puanJev({});
    const v = await aramaYap('belki', { karar: (s, q) => ('uyum' in q ? iki(s, q) : bir(s, q)), katalog });
    expect(v).toMatchObject({ kapsamDisi: false, mesaj: null });
    expect(v.sonuclar.length).toBeGreaterThan(0);
  });

  it('kazak_hirka kapsamı sadece triko ürünleri bırakır; kazakta boy filtresi uygulanmaz', async () => {
    const { filtreler } = await istegiYapilandir('uzun kazak', RENKLER, adimBirJev({ kapsam: ['kazak_hirka', 0.9], uzunluk: ['uzun', 0.9] }));
    const s = katalogDaralt(katalog, filtreler, 'uzun kazak');
    expect(s.adaylar.map((u) => u.kategori)).toEqual(Array(14).fill('kazak'));
  });
});
