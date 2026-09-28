// Jev (System One) istemcisi. Sadece sunucuda çalışır; anahtar istemciye gitmez.
// Uç seçimi: TYPESAFE_API_KEY varsa TypeSafe'in kendi API'si; yoksa AI_GATEWAY_API_KEY ile Vercel AI Gateway.
// İkisi de yoksa ya da JEV_SAHTE=1 ise deterministik sahte cevap döner (ortak/jev_client.py ile aynı mantık).
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { envAl } from './env';

const UCLAR = {
  typesafe: { url: 'https://api.typesafe.ai/v1/systemone', model: 'jev-latest', anahtar: 'TYPESAFE_API_KEY' },
  gateway: { url: 'https://ai-gateway.vercel.sh/typesafe/v1/systemone', model: 'typesafe-ai/jev', anahtar: 'AI_GATEWAY_API_KEY' },
} as const;
const ZAMAN_ASIMI_MS = 15_000;

export type ChoiceSoru = { type: 'choice'; instructions: string; criteria: Record<string, string> };
export type NoulSoru = { type: 'noul'; instructions: string };
export type ScoreSoru = { type: 'score'; instructions: string; criteria: readonly string[] };
export type Soru = ChoiceSoru | NoulSoru | ScoreSoru;

const olasiliklar = z.record(z.string(), z.number());
const ChoiceCevap = z.object({ choice: z.string(), probabilities: olasiliklar, confidence: z.number() });
const NoulCevap = z.object({ noul: z.number() });
// Gerçek API: score olasılıkları seviye indeksiyle ("0".."3") gelir, adlar legend'da.
const ScoreCevap = z.object({
  score: z.number(),
  probabilities: olasiliklar,
  confidence: z.number(),
  legend: z.record(z.string(), z.string()).optional(),
});
const JevYanit = z.object({
  answers: z.record(z.string(), z.unknown()),
  usage: z.object({ input_tokens: z.number() }).partial().optional(),
});

export type ChoiceCevap = z.infer<typeof ChoiceCevap>;
export type NoulCevap = z.infer<typeof NoulCevap>;
export type ScoreCevap = z.infer<typeof ScoreCevap>;
export type JevSonuc = { answers: Readonly<Record<string, unknown>>; inputTokens: number };
export type JevKarar = (state: unknown, questions: Record<string, Soru>) => Promise<JevSonuc>;

export const choiceOku = (s: JevSonuc, ad: string): ChoiceCevap => ChoiceCevap.parse(s.answers[ad]);
export const noulOku = (s: JevSonuc, ad: string): NoulCevap => NoulCevap.parse(s.answers[ad]);
export const scoreOku = (s: JevSonuc, ad: string): ScoreCevap => ScoreCevap.parse(s.answers[ad]);

function ucSec() {
  if (envAl('TYPESAFE_API_KEY')) return UCLAR.typesafe;
  if (envAl('AI_GATEWAY_API_KEY')) return UCLAR.gateway;
  return null;
}

export function sahteMi(): boolean {
  return envAl('JEV_SAHTE') === '1' || ucSec() === null;
}

const yuvarla = (x: number, basamak = 3) => Number(x.toFixed(basamak));

function sahteChoice(soru: ChoiceSoru, r: number) {
  const secenekler = Object.keys(soru.criteria);
  const secim = secenekler[Math.floor(r * secenekler.length) % secenekler.length];
  const kalan = (1 - 0.55 - 0.3 * r) / Math.max(1, secenekler.length - 1);
  const probabilities = Object.fromEntries(secenekler.map((s) => [s, s === secim ? 0.55 + 0.3 * r : kalan]));
  return { type: 'choice', choice: secim, probabilities, confidence: yuvarla(0.4 + 0.5 * r) };
}

function sahteScore(soru: ScoreSoru, r: number) {
  const n = soru.criteria.length;
  const idx = Math.floor(r * n) % Math.max(1, n);
  const degerler = soru.criteria.map((_, j) => (j === idx ? 0.6 : 0.4 / Math.max(1, n - 1)));
  const probabilities = Object.fromEntries(degerler.map((p, j) => [String(j), p]));
  const legend = Object.fromEntries(soru.criteria.map((s, j) => [String(j), s]));
  const beklenen = degerler.reduce((t, p, j) => t + j * p, 0);
  return { type: 'score', score: yuvarla(beklenen, 2), probabilities, legend, confidence: yuvarla(0.5 + 0.4 * r) };
}

export function sahteCevap(state: unknown, questions: Record<string, Soru>): JevSonuc {
  const metin = JSON.stringify(state);
  const tohum = BigInt(`0x${createHash('sha256').update(metin).digest('hex')}`);
  const answers = Object.fromEntries(
    Object.entries(questions).map(([ad, soru], i) => {
      const r = Number((tohum >> BigInt(i * 8)) % 1000n) / 1000;
      if (soru.type === 'choice') return [ad, sahteChoice(soru, r)];
      if (soru.type === 'score') return [ad, sahteScore(soru, r)];
      return [ad, { type: 'noul', noul: yuvarla(r) }];
    }),
  );
  return { answers, inputTokens: Math.floor(metin.length / 4) };
}

async function gercekCagri(state: unknown, questions: Record<string, Soru>): Promise<JevSonuc> {
  const uc = ucSec();
  if (!uc) throw new Error('Jev anahtarı yok');
  const yanit = await fetch(uc.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${envAl(uc.anahtar)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: uc.model, state, questions }),
    signal: AbortSignal.timeout(ZAMAN_ASIMI_MS),
  });
  if (!yanit.ok) throw new Error(`Jev ${yanit.status}: ${(await yanit.text()).slice(0, 300)}`);
  const govde = JevYanit.parse(await yanit.json());
  return { answers: govde.answers, inputTokens: govde.usage?.input_tokens ?? 0 };
}

export const jevKarar: JevKarar = async (state, questions) => {
  if (Object.keys(questions).length === 0) throw new Error('questions boş olamaz');
  return sahteMi() ? sahteCevap(state, questions) : gercekCagri(state, questions);
};
