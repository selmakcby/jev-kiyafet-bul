// Arama hattı: Adım 1 (Jev: isteği yapılandır) → daraltma (kod) → Adım 2 (Jev: puanla) → sıralama (kod).
import { katalogDaralt } from './daralt';
import { istegiYapilandir } from './filtre';
import { jevKarar, sahteMi, type JevKarar } from './jev';
import { katalogAl, sikRenkler } from './katalog';
import { adaylariPuanla, NEDENLER, type PuanliUrun } from './sirala';
import type { AramaVerisi, Kart, Olay } from './tipler';
import type { Urun } from './urun';

export const USD_MILYON_TOKEN = 0.042;

export function karta(p: PuanliUrun): Kart {
  const u = p.urun;
  return {
    id: u.id, ad: u.ad, marka: u.marka, fiyat: u.fiyat, paraBirimi: u.para_birimi, gorsel: u.gorsel_url, url: u.url,
    renk: u.renkler.join(', '), uyumEtiketi: p.etiket, uyumYuzde: p.etiketYuzde,
    skor: Number(p.skor.toFixed(3)), guven: Number(p.guven.toFixed(3)), neden: p.neden,
    nedenMetni: p.neden === 'uyuyor' ? null : (NEDENLER[p.neden as keyof typeof NEDENLER] ?? p.neden),
  };
}

export const kapsamMesaji = (metin: string) => `Bu katalogda sadece dış giyim ve kazak var; '${metin}' kapsam dışı.`;

/** Jev isteği katalog dışı buldu: Adım 2'ye (puanlama) geçilmez, 3–5 atlanır. */
function kapsamDisiSonuc(
  metin: string,
  yapi: Awaited<ReturnType<typeof istegiYapilandir>>,
  katalogBoyutu: number,
  basla: number,
  simdi: () => number,
  bildir: (o: Olay) => void,
): AramaVerisi {
  const sebep = 'İstek katalog dışı; puanlamaya geçilmedi';
  bildir({ adim: 3, atlandi: true, sebep });
  bildir({ adim: 4, atlandi: true, sebep });
  bildir({ adim: 5, atlandi: true, sebep });
  const maliyetUsd = Number(((yapi.inputTokens / 1_000_000) * USD_MILYON_TOKEN).toFixed(6));
  return {
    filtreler: yapi.filtreler, sonuclar: [], katalogBoyutu, adaySayisi: 0, cagri: 1, token: yapi.inputTokens, maliyetUsd,
    sureMs: Math.round(simdi() - basla), ornekMod: sahteMi(), kapsamDisi: true, mesaj: kapsamMesaji(metin),
  };
}

export type AramaSecenekleri = Readonly<{
  karar?: JevKarar;
  katalog?: readonly Urun[];
  bildir?: (olay: Olay) => void;
  simdi?: () => number;
}>;

export async function aramaYap(metin: string, secenek: AramaSecenekleri = {}): Promise<AramaVerisi> {
  const { karar = jevKarar, bildir = () => {}, simdi = () => performance.now() } = secenek;
  const katalog = secenek.katalog ?? katalogAl();
  const basla = simdi();
  const renkler = sikRenkler(katalog);

  const yapi = await istegiYapilandir(metin, renkler, karar);
  bildir({ adim: 1, state: metin, sorular: Object.entries(yapi.sorular).map(([ad, s]) => ({ ad, tip: s.type, talimat: s.instructions })) });
  bildir({ adim: 2, filtreler: yapi.filtreler, ham: yapi.hamCevap });

  if (yapi.kapsamDisi) return kapsamDisiSonuc(metin, yapi, katalog.length, basla, simdi, bildir);

  const dar = katalogDaralt(katalog, yapi.filtreler, metin);
  const adlar = (durum: string) => dar.filtreler.filter((f) => f.durum === durum).map((f) => f.etiket);
  bildir({ adim: 3, katalog: katalog.length, eslesen: dar.eslesen, tamEslesen: dar.tamEslesen, aday: dar.adaylar.length, uygulanan: adlar('uygulandi'), gevsetilen: adlar('gevsetildi') });

  const puan = await adaylariPuanla(metin, dar.adaylar, karar, (i) =>
    bildir({ adim: 4, tamamlanan: i.tamamlanan, toplam: i.toplam, enIyi: i.enIyi.map(karta), ham: i.enIyi[0]?.ham ?? null }),
  );

  const token = yapi.inputTokens + puan.inputTokens;
  const maliyetUsd = Number(((token / 1_000_000) * USD_MILYON_TOKEN).toFixed(6));
  const sureMs = Math.round(simdi() - basla);
  const cagri = 1 + puan.cagri;
  bildir({ adim: 5, sureMs, token, maliyetUsd, cagri });

  return {
    filtreler: dar.filtreler, sonuclar: puan.sonuclar.map(karta), katalogBoyutu: katalog.length,
    adaySayisi: dar.adaylar.length, cagri, token, maliyetUsd, sureMs, ornekMod: secenek.karar ? false : sahteMi(),
    kapsamDisi: false, mesaj: null,
  };
}
