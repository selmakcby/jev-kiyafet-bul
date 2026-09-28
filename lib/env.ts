// Sunucu tarafı ortam değişkeni okuyucu. Önce process.env (Vercel), yoksa yerelde ~/.env.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function envDosyasiOku(): Readonly<Record<string, string>> {
  const dosya = path.join(os.homedir(), '.env');
  if (!fs.existsSync(dosya)) return {};
  const satirlar = fs.readFileSync(dosya, 'utf8').split('\n');
  return satirlar
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('#') && s.includes('='))
    .reduce<Record<string, string>>((acc, s) => {
      const i = s.indexOf('=');
      const deger = s.slice(i + 1).trim().replace(/^["']|["']$/g, '');
      return { ...acc, [s.slice(0, i).trim()]: deger };
    }, {});
}

let onbellek: Readonly<Record<string, string>> | null = null;

export function envAl(ad: string): string | undefined {
  const dogrudan = process.env[ad];
  if (dogrudan) return dogrudan;
  onbellek = onbellek ?? envDosyasiOku();
  return onbellek[ad] || undefined;
}
