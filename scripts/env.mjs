// Anahtar okur: önce process.env, sonra kiyafet-bul/.env.local, sonra ~/.env.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DOSYALAR = [fileURLToPath(new URL('../.env.local', import.meta.url)), path.join(os.homedir(), '.env')];

function dosyadanOku(dosya, ad) {
  if (!fs.existsSync(dosya)) return undefined;
  const satir = fs.readFileSync(dosya, 'utf8').split('\n').find((s) => s.trim().startsWith(`${ad}=`));
  return satir?.slice(satir.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '') || undefined;
}

export function envOku(ad) {
  if (process.env[ad]) return process.env[ad];
  const deger = DOSYALAR.map((d) => dosyadanOku(d, ad)).find(Boolean);
  if (!deger) throw new Error(`${ad} bulunamadı (ortam, kiyafet-bul/.env.local ya da ~/.env)`);
  return deger;
}
