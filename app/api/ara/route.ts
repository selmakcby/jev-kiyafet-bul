// POST /api/ara — { metin } → { success, data, error }. Accept: text/event-stream ise adım adım SSE.
import { z } from 'zod';
import { aramaYap } from '@/lib/ara';
import { gunlukYaz } from '@/lib/gunluk';
import { kotaKontrol } from '@/lib/kota';
import type { AramaVerisi, Olay, Zarf } from '@/lib/tipler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Istek = z.object({ metin: z.string().trim().min(3, 'En az 3 karakter yaz').max(300, 'En fazla 300 karakter') });
const HATA_GENEL = 'Arama şu an yapılamadı, birazdan tekrar dene.';

const zarf = (veri: Zarf<AramaVerisi>, status = 200) => Response.json(veri, { status });
const hata = (mesaj: string, status: number) => zarf({ success: false, data: null, error: mesaj }, status);

function ipAl(istek: Request): string {
  const ileri = istek.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return ileri || istek.headers.get('x-real-ip') || 'yerel';
}

async function govdeOku(istek: Request) {
  const ham: unknown = await istek.json().catch(() => null);
  return Istek.safeParse(ham);
}

function akisCevabi(metin: string): Response {
  const kodla = new TextEncoder();
  const akis = new ReadableStream<Uint8Array>({
    async start(kontrol) {
      const gonder = (tur: string, veri: unknown) => kontrol.enqueue(kodla.encode(`event: ${tur}\ndata: ${JSON.stringify(veri)}\n\n`));
      try {
        const data = await aramaYap(metin, { bildir: (o: Olay) => gonder('adim', o) });
        gunlukYaz('arama', { mod: 'akis', token: data.token, sureMs: data.sureMs, cagri: data.cagri });
        gonder('sonuc', { success: true, data, error: null });
      } catch (e) {
        gunlukYaz('arama_hata', { mesaj: e instanceof Error ? e.message.slice(0, 200) : 'bilinmeyen' });
        gonder('sonuc', { success: false, data: null, error: HATA_GENEL });
      } finally {
        kontrol.close();
      }
    },
  });
  return new Response(akis, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform' } });
}

export async function POST(istek: Request): Promise<Response> {
  const govde = await govdeOku(istek);
  if (!govde.success) return hata(govde.error.issues[0]?.message ?? 'Geçersiz istek', 400);
  const kota = kotaKontrol(ipAl(istek));
  if (!kota.izin) {
    return hata(kota.sebep === 'gunluk' ? 'Bugünlük kota bitti, yarın yine gel' : 'Çok hızlı arıyorsun, bir dakika sonra tekrar dene', 429);
  }
  if (istek.headers.get('accept')?.includes('text/event-stream')) return akisCevabi(govde.data.metin);
  try {
    const data = await aramaYap(govde.data.metin);
    gunlukYaz('arama', { mod: 'json', token: data.token, sureMs: data.sureMs, cagri: data.cagri });
    return zarf({ success: true, data, error: null });
  } catch (e) {
    gunlukYaz('arama_hata', { mesaj: e instanceof Error ? e.message.slice(0, 200) : 'bilinmeyen' });
    return hata(HATA_GENEL, 500);
  }
}
