import { describe, expect, it, vi } from 'vitest';
import { adaylariPuanla, PARTI_BOYU, SONUC_SAYISI } from '@/lib/sirala';
import { puanJev, urun } from './yardimci';

describe('adaylariPuanla', () => {
  it('skor × güvene göre sıralar (yüksek skor ama düşük güven geriye düşer)', async () => {
    const adaylar = [urun({ id: 'a', ad: 'A' }), urun({ id: 'b', ad: 'B' }), urun({ id: 'c', ad: 'C' })];
    const jev = puanJev({ A: [3, 0.3], B: [2.4, 0.9], C: [1.5, 0.9] });
    const { sonuclar } = await adaylariPuanla('istek', adaylar, jev);
    expect(sonuclar.map((s) => s.urun.id)).toEqual(['b', 'c', 'a']);
    expect(sonuclar[0].sira).toBeCloseTo((2.4 / 3) * 0.9);
  });

  it(`ilk ${SONUC_SAYISI} sonucu keser, token toplar, partiler halinde ilerleme bildirir`, async () => {
    const adaylar = Array.from({ length: 25 }, (_, i) => urun({ id: `u${i}`, ad: `U${i}` }));
    const tablo = Object.fromEntries(adaylar.map((u, i) => [u.ad, [i / 8, 0.8] as [number, number]]));
    const ilerleme = vi.fn();
    const s = await adaylariPuanla('istek', adaylar, puanJev(tablo), ilerleme);
    expect(s.sonuclar).toHaveLength(SONUC_SAYISI);
    expect(s.sonuclar[0].urun.id).toBe('u24');
    expect(s.inputTokens).toBe(25 * 50);
    expect(ilerleme).toHaveBeenCalledTimes(Math.ceil(25 / PARTI_BOYU));
    expect(ilerleme.mock.calls.at(-1)?.[0]).toMatchObject({ tamamlanan: 25, toplam: 25 });
  });

  it('seviye etiketini legend üzerinden okur, uymayan nedeni taşır', async () => {
    const { sonuclar } = await adaylariPuanla('istek', [urun({ id: 'x', ad: 'X' })], puanJev({ X: [3, 0.9] }));
    expect(sonuclar[0]).toMatchObject({ etiket: 'Tam isabet', etiketYuzde: 70, neden: 'uyuyor' });
  });
});
