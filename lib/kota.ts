// Bellek içi kota: IP başına dakikalık pencere + günlük toplam tavan.
// Not: Vercel'de her fonksiyon örneğinin kendi belleği var; kalıcı sayaç için KV/Upstash'e taşınmalı.
import { envAl } from './env';

export const DAKIKA_LIMITI = 10;
const PENCERE_MS = 60_000;
const VARSAYILAN_TAVAN = 300;

type Durum = Readonly<{ gun: string; gunluk: number; ipler: ReadonlyMap<string, readonly number[]> }>;
export type KotaSonucu = { izin: true } | { izin: false; sebep: 'dakika' | 'gunluk' };

const bugun = (simdi: number) => new Date(simdi).toISOString().slice(0, 10);
let durum: Durum = { gun: '', gunluk: 0, ipler: new Map() };

export function gunlukTavan(): number {
  const deger = Number(envAl('GUNLUK_TAVAN'));
  return Number.isInteger(deger) && deger > 0 ? deger : VARSAYILAN_TAVAN;
}

export function kotaKontrol(ip: string, simdi: number = Date.now()): KotaSonucu {
  const gun = bugun(simdi);
  const taban: Durum = durum.gun === gun ? durum : { gun, gunluk: 0, ipler: new Map() };
  if (taban.gunluk >= gunlukTavan()) {
    durum = taban;
    return { izin: false, sebep: 'gunluk' };
  }
  const yakin = (taban.ipler.get(ip) ?? []).filter((t) => simdi - t < PENCERE_MS);
  if (yakin.length >= DAKIKA_LIMITI) {
    durum = taban;
    return { izin: false, sebep: 'dakika' };
  }
  const ipler = new Map(taban.ipler);
  ipler.set(ip, [...yakin, simdi]);
  durum = { gun, gunluk: taban.gunluk + 1, ipler };
  return { izin: true };
}

/** Sadece testler için. */
export function kotaSifirla(): void {
  durum = { gun: '', gunluk: 0, ipler: new Map() };
}
