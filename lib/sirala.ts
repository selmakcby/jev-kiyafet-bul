// Adım 2 (Jev) + sıralama (kod): her aday için uyum puanı ve uymama nedeni.
import { choiceOku, scoreOku, type JevKarar, type Soru } from './jev';
import type { Urun } from './urun';

export const PARTI_BOYU = 10;
export const SONUC_SAYISI = 12;
const ACIKLAMA_SINIRI = 600;
export const UYUM_SEVIYELERI = ['Alakasız', 'Kısmen', 'İyi', 'Tam isabet'] as const;
export const NEDENLER = {
  fiyat: 'Fiyat istenenden yüksek',
  renk: 'Renk istenenden farklı',
  kesim: 'Kesim ya da model farklı',
  uzunluk: 'Boy istenenden farklı',
  malzeme: 'Malzeme istenenden farklı',
  uyuyor: 'Ürün isteğe uyuyor',
} as const;

export const PUAN_SORULARI: Record<string, Soru> = {
  uyum: { type: 'score', instructions: 'Ürün isteğe ne kadar uyuyor', criteria: UYUM_SEVIYELERI },
  neden_uymuyor: { type: 'choice', instructions: 'Ürün isteğe tam uymuyorsa en önemli neden hangisi?', criteria: NEDENLER },
};

export type PuanliUrun = Readonly<{
  urun: Urun;
  skor: number; // 0..1 (ondalık score / en yüksek seviye indeksi)
  guven: number;
  sira: number; // skor × güven
  etiket: string; // en olası seviye
  etiketYuzde: number; // o seviyenin olasılığı, %
  neden: keyof typeof NEDENLER | string;
  ham: Readonly<Record<string, unknown>>;
}>;

export type PuanlamaIlerleme = Readonly<{ tamamlanan: number; toplam: number; enIyi: readonly PuanliUrun[] }>;

function puanla(urun: Urun, sonuc: Awaited<ReturnType<JevKarar>>): PuanliUrun {
  const uyum = scoreOku(sonuc, 'uyum');
  const neden = choiceOku(sonuc, 'neden_uymuyor');
  const skor = Math.min(1, Math.max(0, uyum.score / (UYUM_SEVIYELERI.length - 1)));
  const [anahtar, olasilik] = Object.entries(uyum.probabilities).sort((a, b) => b[1] - a[1])[0] ?? ['—', 0];
  const etiket = uyum.legend?.[anahtar] ?? UYUM_SEVIYELERI[Number(anahtar)] ?? anahtar;
  return {
    urun, skor, guven: uyum.confidence, sira: skor * uyum.confidence,
    etiket, etiketYuzde: Math.round(olasilik * 100), neden: neden.choice, ham: sonuc.answers,
  };
}

export const siralaVeKes = (liste: readonly PuanliUrun[], n = SONUC_SAYISI): readonly PuanliUrun[] =>
  [...liste].sort((a, b) => b.sira - a.sira).slice(0, n);

const partilere = <T,>(liste: readonly T[], boy: number): readonly (readonly T[])[] =>
  Array.from({ length: Math.ceil(liste.length / boy) }, (_, i) => liste.slice(i * boy, (i + 1) * boy));

export type PuanlamaSonucu = Readonly<{ sonuclar: readonly PuanliUrun[]; inputTokens: number; cagri: number }>;

/** Adayları 10'arlı partiler halinde paralel puanlar; her parti bitince ilerleme bildirir. */
export async function adaylariPuanla(
  istek: string,
  adaylar: readonly Urun[],
  karar: JevKarar,
  ilerleme: (i: PuanlamaIlerleme) => void = () => {},
): Promise<PuanlamaSonucu> {
  const baslangic: { puanli: readonly PuanliUrun[]; token: number } = { puanli: [], token: 0 };
  const son = await partilere(adaylar, PARTI_BOYU).reduce(async (oncekiP, parti) => {
    const onceki = await oncekiP;
    const cevaplar = await Promise.all(
      parti.map(async (u) => {
        const state = { istek, urun: { ad: u.ad, aciklama: u.aciklama.slice(0, ACIKLAMA_SINIRI), renk: u.renkler.join(', '), fiyat: `${u.fiyat} ${u.para_birimi}` } };
        const sonuc = await karar(state, PUAN_SORULARI);
        return { puanli: puanla(u, sonuc), token: sonuc.inputTokens };
      }),
    );
    const guncel = { puanli: [...onceki.puanli, ...cevaplar.map((c) => c.puanli)], token: onceki.token + cevaplar.reduce((t, c) => t + c.token, 0) };
    ilerleme({ tamamlanan: guncel.puanli.length, toplam: adaylar.length, enIyi: siralaVeKes(guncel.puanli, 3) });
    return guncel;
  }, Promise.resolve(baslangic));
  return { sonuclar: siralaVeKes(son.puanli), inputTokens: son.token, cagri: adaylar.length };
}
