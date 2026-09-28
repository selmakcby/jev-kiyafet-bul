import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { POST } from '@/app/api/ara/route';
import { DAKIKA_LIMITI, kotaSifirla } from '@/lib/kota';

const istek = (govde: unknown, ip = '1.1.1.1', ek: Record<string, string> = {}) =>
  new Request('http://yerel/api/ara', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip, ...ek },
    body: JSON.stringify(govde),
  });

beforeEach(() => kotaSifirla());
afterEach(() => {
  delete process.env.GUNLUK_TAVAN;
});

describe('POST /api/ara', () => {
  it('boş metin 400 ve Türkçe hata zarfı döner', async () => {
    const y = await POST(istek({ metin: '  ' }));
    expect(y.status).toBe(400);
    expect(await y.json()).toMatchObject({ success: false, data: null, error: expect.any(String) });
  });

  it('300 karakteri aşan metin 400', async () => {
    expect((await POST(istek({ metin: 'a'.repeat(301) }))).status).toBe(400);
  });

  it('geçerli istek zarf şeklinde döner; model adı yok', async () => {
    const y = await POST(istek({ metin: 'uzun bej trench, kemerli, M beden, 3000 TL altı' }));
    expect(y.status).toBe(200);
    const z = await y.json();
    expect(z).toMatchObject({ success: true, error: null });
    expect(Object.keys(z.data).sort()).toEqual(
      ['adaySayisi', 'cagri', 'filtreler', 'kapsamDisi', 'katalogBoyutu', 'maliyetUsd', 'mesaj', 'ornekMod', 'sonuclar', 'sureMs', 'token'],
    );
    expect(z.data.sonuclar.length).toBeLessThanOrEqual(12);
    expect(JSON.stringify(z)).not.toMatch(/typesafe|jev-|gateway/i);
  });

  it(`IP başına dakikada ${DAKIKA_LIMITI} istekten sonra 429`, async () => {
    const yanitlar = await Array.from({ length: DAKIKA_LIMITI + 1 }).reduce<Promise<number[]>>(
      async (p) => [...(await p), (await POST(istek({ metin: 'x' }, '2.2.2.2'))).status],
      Promise.resolve([]),
    );
    expect(yanitlar.filter((s) => s === 429)).toHaveLength(0);
    // Geçersiz istekler kotaya sayılmaz; geçerli olanlar sayılır:
    const gecerli = await Array.from({ length: DAKIKA_LIMITI + 1 }).reduce<Promise<number[]>>(
      async (p) => [...(await p), (await POST(istek({ metin: 'siyah mont' }, '3.3.3.3'))).status],
      Promise.resolve([]),
    );
    expect(gecerli.at(-1)).toBe(429);
  });

  it('günlük tavan dolunca 429 ve "Bugünlük kota bitti" mesajı', async () => {
    process.env.GUNLUK_TAVAN = '1';
    expect((await POST(istek({ metin: 'siyah mont' }, '4.4.4.4'))).status).toBe(200);
    const y = await POST(istek({ metin: 'siyah mont' }, '5.5.5.5'));
    expect(y.status).toBe(429);
    expect((await y.json()).error).toBe('Bugünlük kota bitti, yarın yine gel');
  });

  it('Accept: text/event-stream ile adımları ve sonucu akıtır', async () => {
    const y = await POST(istek({ metin: 'kapüşonlu mont' }, '6.6.6.6', { Accept: 'text/event-stream' }));
    expect(y.headers.get('content-type')).toContain('text/event-stream');
    const metin = await y.text();
    [1, 2, 3, 4, 5].forEach((n) => expect(metin).toContain(`"adim":${n}`));
    expect(metin).toContain('event: sonuc');
  });
});
