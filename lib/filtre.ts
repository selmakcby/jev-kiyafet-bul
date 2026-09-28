// Adım 1: kullanıcı isteğini tek Jev çağrısıyla yapılandırır. Fiyat ve beden koddan (regex).
import { choiceOku, noulOku, type JevKarar, type Soru } from './jev';
import { bedenCikar, fiyatCikar } from './regex';

export const GUVEN_ESIGI = 0.5;

export type FiltreAdi = 'kapsam' | 'tur' | 'uzunluk' | 'renk' | 'kemerli' | 'kapusonlu' | 'su_gecirmez' | 'butce' | 'beden';
export type FiltreDurumu = 'uygulandi' | 'atlandi' | 'belirtilmedi' | 'gevsetildi';

export type Filtre = Readonly<{
  ad: FiltreAdi;
  etiket: string;
  deger: string | number | boolean | null;
  gorunen: string;
  guven: number | null;
  olasiliklar: Readonly<Record<string, number>> | null;
  kaynak: 'jev' | 'kod';
  durum: FiltreDurumu;
  not?: string;
}>;

export type Renk = Readonly<{ anahtar: string; ad: string }>;

const TUR_SECENEKLERI = {
  ceket: 'Ceket (deri, kot, bomber, oduncu vb.)',
  mont: 'Mont, şişme mont, parka, yağmurluk',
  trenckot: 'Trençkot (trench coat)',
  kaban: 'Kaban, palto, uzun yün dış giyim',
  blazer: 'Blazer ceket, takım ceketi',
  kazak: 'Kazak, süveter, triko',
  hirka: 'Hırka (önü açık, düğmeli triko)',
  farketmez: 'Tür belirtilmemiş',
};
const UZUNLUK_SECENEKLERI = {
  kisa: 'Kısa: bel ya da kalça boyu, crop',
  orta: 'Orta: kalça altı, diz üstü',
  uzun: 'Uzun: diz hizası ve altı, maxi',
  farketmez: 'Boy belirtilmemiş',
};
export const KAPSAM_SECENEKLERI = {
  dis_giyim: 'Ceket, mont, trençkot, kaban gibi dış giyim arıyor',
  kazak_hirka: 'Kazak, hırka, süveter, triko arıyor',
  katalog_disi: 'Bu ikisinin dışında bir ürün (pantolon, ayakkabı, elbise, mayo, aksesuar…) ya da giyim dışı bir şey',
};
const KAPSAM_ADLARI: Readonly<Record<string, string>> = { dis_giyim: 'dış giyim', kazak_hirka: 'kazak / hırka', katalog_disi: 'katalog dışı' };
const TUR_ADLARI: Readonly<Record<string, string>> = {
  kazak: 'kazak', hirka: 'hırka',
  ceket: 'ceket', mont: 'mont', trenckot: 'trençkot', kaban: 'kaban', blazer: 'blazer', farketmez: 'farketmez',
};
const UZUNLUK_ADLARI: Readonly<Record<string, string>> = { kisa: 'kısa', orta: 'orta', uzun: 'uzun', farketmez: 'farketmez' };

export function sorulariKur(renkler: readonly Renk[]): Record<string, Soru> {
  const renkKriter = Object.fromEntries([...renkler.map((r) => [r.anahtar, r.ad]), ['farketmez', 'Renk belirtilmemiş']]);
  return {
    kapsam: { type: 'choice', instructions: 'Kullanıcı ne tür bir ürün arıyor?', criteria: KAPSAM_SECENEKLERI },
    tur: { type: 'choice', instructions: 'Kullanıcı hangi tür üst giyim arıyor?', criteria: TUR_SECENEKLERI },
    uzunluk: { type: 'choice', instructions: 'Kullanıcı nasıl bir boy istiyor?', criteria: UZUNLUK_SECENEKLERI },
    renk: { type: 'choice', instructions: 'Kullanıcı hangi rengi istiyor? En yakın rengi seç.', criteria: renkKriter },
    kemerli: { type: 'noul', instructions: 'Kullanıcı kemerli bir model istiyor.' },
    kapusonlu: { type: 'noul', instructions: 'Kullanıcı kapüşonlu bir model istiyor.' },
    su_gecirmez: { type: 'noul', instructions: 'Kullanıcı su geçirmez ya da yağmura dayanıklı bir model istiyor.' },
    butce_var: { type: 'noul', instructions: 'Kullanıcı bir fiyat üst sınırı belirtti.' },
  };
}

function choiceFiltre(ad: FiltreAdi, etiket: string, cevap: ReturnType<typeof choiceOku>, adlar: Readonly<Record<string, string>>): Filtre {
  const belirtilmedi = cevap.choice === 'farketmez';
  const durum: FiltreDurumu = belirtilmedi ? 'belirtilmedi' : cevap.confidence < GUVEN_ESIGI ? 'atlandi' : 'uygulandi';
  return {
    ad, etiket, deger: cevap.choice, gorunen: adlar[cevap.choice] ?? cevap.choice,
    guven: cevap.confidence, olasiliklar: cevap.probabilities, kaynak: 'jev', durum,
  };
}

function noulFiltre(ad: FiltreAdi, etiket: string, noul: number): Filtre {
  const evet = noul >= GUVEN_ESIGI;
  return {
    ad, etiket, deger: evet, gorunen: evet ? 'evet' : 'istenmedi',
    guven: noul, olasiliklar: null, kaynak: 'jev', durum: evet ? 'uygulandi' : 'belirtilmedi',
  };
}

function butceFiltre(metin: string, noul: number): Filtre {
  const tavan = fiyatCikar(metin);
  const jevEvet = noul >= GUVEN_ESIGI;
  const durum: FiltreDurumu = tavan === null ? 'belirtilmedi' : jevEvet ? 'uygulandi' : 'atlandi';
  const not = tavan !== null && !jevEvet ? 'Sayı bulundu ama Jev bütçe olduğundan emin değil' : undefined;
  return {
    ad: 'butce', etiket: 'Bütçe', deger: tavan, gorunen: tavan === null ? '—' : `≤ ${tavan.toLocaleString('tr-TR')} TL`,
    guven: noul, olasiliklar: null, kaynak: 'kod', durum, ...(not ? { not } : {}),
  };
}

function bedenFiltre(metin: string): Filtre {
  const beden = bedenCikar(metin);
  return {
    ad: 'beden', etiket: 'Beden', deger: beden, gorunen: beden ?? '—',
    guven: null, olasiliklar: null, kaynak: 'kod', durum: beden ? 'uygulandi' : 'belirtilmedi',
  };
}

export type YapilandirmaSonucu = Readonly<{
  filtreler: readonly Filtre[];
  sorular: Record<string, Soru>;
  hamCevap: Readonly<Record<string, unknown>>;
  inputTokens: number;
  kapsamDisi: boolean;
}>;

/** Adım 1: tek Jev çağrısı + regex. Güveni eşiğin altındaki filtreler "atlandi" olarak işaretlenir. */
export async function istegiYapilandir(metin: string, renkler: readonly Renk[], karar: JevKarar): Promise<YapilandirmaSonucu> {
  const sorular = sorulariKur(renkler);
  const sonuc = await karar(metin, sorular);
  const renkAdlari = Object.fromEntries([...renkler.map((r) => [r.anahtar, r.ad]), ['farketmez', 'farketmez']]);
  const kapsam = choiceOku(sonuc, 'kapsam');
  const kapsamDisi = kapsam.choice === 'katalog_disi' && kapsam.confidence >= GUVEN_ESIGI;
  const filtreler: readonly Filtre[] = [
    choiceFiltre('kapsam', 'Kapsam', kapsam, KAPSAM_ADLARI),
    choiceFiltre('tur', 'Tür', choiceOku(sonuc, 'tur'), TUR_ADLARI),
    choiceFiltre('uzunluk', 'Boy', choiceOku(sonuc, 'uzunluk'), UZUNLUK_ADLARI),
    choiceFiltre('renk', 'Renk', choiceOku(sonuc, 'renk'), renkAdlari),
    noulFiltre('kemerli', 'Kemerli', noulOku(sonuc, 'kemerli').noul),
    noulFiltre('kapusonlu', 'Kapüşonlu', noulOku(sonuc, 'kapusonlu').noul),
    noulFiltre('su_gecirmez', 'Su geçirmez', noulOku(sonuc, 'su_gecirmez').noul),
    butceFiltre(metin, noulOku(sonuc, 'butce_var').noul),
    bedenFiltre(metin),
  ];
  return { filtreler, sorular, hamCevap: sonuc.answers, inputTokens: sonuc.inputTokens, kapsamDisi };
}
