// İstemci ile sunucunun paylaştığı tipler (sunucu modülü içermez).
import type { Filtre } from './filtre';

export type { Filtre };

export type Kart = Readonly<{
  id: string;
  ad: string;
  marka: string;
  fiyat: number;
  paraBirimi: string;
  gorsel: string;
  url: string;
  renk: string;
  uyumEtiketi: string;
  uyumYuzde: number;
  skor: number;
  guven: number;
  neden: string;
  nedenMetni: string | null;
}>;

export type AramaVerisi = Readonly<{
  filtreler: readonly Filtre[];
  sonuclar: readonly Kart[];
  katalogBoyutu: number;
  adaySayisi: number;
  cagri: number;
  token: number;
  maliyetUsd: number;
  sureMs: number;
  ornekMod: boolean;
  kapsamDisi: boolean;
  mesaj: string | null;
}>;

export type Zarf<T> = Readonly<{ success: boolean; data: T | null; error: string | null }>;

export type SoruOzet = Readonly<{ ad: string; tip: string; talimat: string }>;

/** Kapsam dışı isteklerde Adım 3–5 çalışmaz. */
export type AtlananAdim<N extends 3 | 4 | 5> = Readonly<{ adim: N; atlandi: true; sebep: string }>;

export type Olay =
  | Readonly<{ adim: 1; state: string; sorular: readonly SoruOzet[] }>
  | Readonly<{ adim: 2; filtreler: readonly Filtre[]; ham: unknown }>
  | AtlananAdim<3>
  | AtlananAdim<4>
  | AtlananAdim<5>
  | Readonly<{ adim: 3; katalog: number; eslesen: number; tamEslesen: number; aday: number; uygulanan: readonly string[]; gevsetilen: readonly string[] }>
  | Readonly<{ adim: 4; tamamlanan: number; toplam: number; enIyi: readonly Kart[]; ham: unknown }>
  | Readonly<{ adim: 5; sureMs: number; token: number; maliyetUsd: number; cagri: number }>;

export type OlayHaritasi = Readonly<{ [N in Olay['adim']]?: Extract<Olay, { adim: N }> }>;
