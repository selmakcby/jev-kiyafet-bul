// Apify'dan ham Trendyol dış giyim verisini çeker → data/ham.json (mevcutla id üzerinden birleştirir).
// Kullanım: node scripts/ham-cek.mjs [sorgu ...]   (sorgu verilmezse SORGULAR)
// Dönüştürme ayrı: scripts/katalog-cek.mjs. Koşu başı maliyet tavanı: MAKS_USD.
import { ApifyClient } from 'apify-client';
import fs from 'node:fs';
import { envOku } from './env.mjs';

const ACTOR = 'fatihtahta/trendyol-scraper';
// Actor çok sorguyu tek koşuda verince bazılarını atlıyor; sorguları tek tek koşmak daha güvenilir.
const VARSAYILAN = ['kadın trençkot', 'trenchcoat', 'kadın kaban', 'kadın mont', 'kadın ceket', 'kadın kazak', 'kadın hırka'];
const SORGULAR = process.argv.length > 2 ? process.argv.slice(2) : VARSAYILAN;
const HAM = new URL('../data/ham.json', import.meta.url);
const SORGU_BASI = Number(process.env.SORGU_BASI ?? 100);
const MAKS_URUN = SORGULAR.length * SORGU_BASI;
const URUN_BASI_USD = 0.00099 + 0.0007; // listeleme + zenginleştirme, en pahalı kademe (FREE) varsayımı
const MAKS_USD = 1.9;

const tahmin = MAKS_URUN * URUN_BASI_USD;
if (tahmin > 2) {
  process.stderr.write(`Tahmini maliyet ${tahmin.toFixed(2)} USD > 2 USD, durduruldu.\n`);
  process.exit(1);
}

const istemci = new ApifyClient({ token: envOku('APIFY_TOKEN') });
const kosu = await istemci.actor(ACTOR).call(
  { queries: SORGULAR, limit: SORGU_BASI, enrich_data: true },
  { maxItems: MAKS_URUN, maxTotalChargeUsd: MAKS_USD },
);
const { items } = await istemci.dataset(kosu.defaultDatasetId).listItems({ limit: MAKS_URUN + 50 });
const onceki = fs.existsSync(HAM) ? JSON.parse(fs.readFileSync(HAM, 'utf8')) : [];
const birlesik = [...new Map([...onceki, ...items].map((u) => [String(u.id), u])).values()];
fs.writeFileSync(HAM, JSON.stringify(birlesik));
process.stdout.write(`${kosu.status} | ${items.length} yeni kayıt, toplam ${birlesik.length} | ${kosu.usageTotalUsd} USD platform | olaylar ${JSON.stringify(kosu.chargedEventCounts)} | run ${kosu.id}\n`);
