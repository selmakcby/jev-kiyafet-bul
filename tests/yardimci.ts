// Test yardımcıları: kontrollü sahte Jev ve örnek ürün.
import type { JevKarar, JevSonuc } from '@/lib/jev';
import type { Urun } from '@/lib/urun';

export function urun(ek: Partial<Urun> & { id: string }): Urun {
  return {
    ad: `Ürün ${ek.id}`, marka: 'Marka', kategori: 'trenckot', fiyat: 1000, para_birimi: 'TRY', renkler: ['Bej'],
    bedenler: [], aciklama: 'Boy: Uzun', url: `https://www.trendyol.com/p-${ek.id}`, gorsel_url: `https://cdn.dsmcdn.com/${ek.id}.jpg`,
    uzunluk: 'uzun', kemerli: true, kapusonlu: false, su_gecirmez: false, ...ek,
  };
}

const choice = (secim: string, guven: number) => ({ type: 'choice', choice: secim, probabilities: { [secim]: guven }, confidence: guven });

export type AdimBirAyari = Readonly<{
  kapsam?: [string, number]; tur?: [string, number]; uzunluk?: [string, number]; renk?: [string, number];
  kemerli?: number; kapusonlu?: number; su_gecirmez?: number; butce_var?: number;
}>;

/** Adım 1 için sabit cevap veren sahte Jev. */
export function adimBirJev(a: AdimBirAyari): JevKarar {
  return async (): Promise<JevSonuc> => ({
    inputTokens: 100,
    answers: {
      kapsam: choice(...(a.kapsam ?? ['dis_giyim', 0.9])),
      tur: choice(...(a.tur ?? ['farketmez', 0.9])),
      uzunluk: choice(...(a.uzunluk ?? ['farketmez', 0.9])),
      renk: choice(...(a.renk ?? ['farketmez', 0.9])),
      kemerli: { type: 'noul', noul: a.kemerli ?? 0.1 },
      kapusonlu: { type: 'noul', noul: a.kapusonlu ?? 0.1 },
      su_gecirmez: { type: 'noul', noul: a.su_gecirmez ?? 0.1 },
      butce_var: { type: 'noul', noul: a.butce_var ?? 0.1 },
    },
  });
}

/** Adım 2 için: ürün adına göre (score, confidence) veren sahte Jev. */
export function puanJev(tablo: Readonly<Record<string, [number, number]>>): JevKarar {
  return async (state): Promise<JevSonuc> => {
    const ad = (state as { urun: { ad: string } }).urun.ad;
    const [score, confidence] = tablo[ad] ?? [0, 0.5];
    const idx = String(Math.round(score));
    return {
      inputTokens: 50,
      answers: {
        uyum: { type: 'score', score, confidence, probabilities: { [idx]: 0.7, '0': idx === '0' ? 0.7 : 0.3 }, legend: { '0': 'Alakasız', '1': 'Kısmen', '2': 'İyi', '3': 'Tam isabet' } },
        neden_uymuyor: choice(score >= 2.5 ? 'uyuyor' : 'renk', 0.8),
      },
    };
  };
}
