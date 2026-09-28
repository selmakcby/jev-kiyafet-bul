'use client';
// Arama durumu: /api/ara'yı SSE ile çağırır, adımları sırayla (kısa aralıkla) panele verir.
import { useCallback, useRef, useState } from 'react';
import { akisParcala, type AkisOlayi } from '@/lib/akis-oku';
import type { AramaVerisi, Olay, OlayHaritasi, Zarf } from '@/lib/tipler';

const ADIM_ARALIGI_MS = 160;
const bekle = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type AramaDurumu = Readonly<{
  durum: 'bos' | 'yukleniyor' | 'bitti' | 'hata';
  olaylar: OlayHaritasi;
  veri: AramaVerisi | null;
  hata: string | null;
}>;

const BOS: AramaDurumu = { durum: 'bos', olaylar: {}, veri: null, hata: null };

export function useArama() {
  const [durum, setDurum] = useState<AramaDurumu>(BOS);
  const calisiyor = useRef(false);

  const olayIsle = useCallback(async (o: AkisOlayi) => {
    if (o.tur === 'adim') {
      const olay = o.veri as Olay;
      setDurum((d) => ({ ...d, olaylar: { ...d.olaylar, [olay.adim]: olay } }));
      await bekle(ADIM_ARALIGI_MS);
      return;
    }
    const z = o.veri as Zarf<AramaVerisi>;
    setDurum((d) => (z.success ? { ...d, durum: 'bitti', veri: z.data } : { ...d, durum: 'hata', hata: z.error }));
  }, []);

  const akisiOku = useCallback(async (govde: ReadableStream<Uint8Array>) => {
    const okuyucu = govde.getReader();
    const cozucu = new TextDecoder();
    const dongu = async (tampon: string): Promise<void> => {
      const { done, value } = await okuyucu.read();
      const { olaylar, kalan } = akisParcala(tampon + (done ? '\n\n' : cozucu.decode(value, { stream: true })));
      await olaylar.reduce((p, o) => p.then(() => olayIsle(o)), Promise.resolve());
      if (!done) await dongu(kalan);
    };
    await dongu('');
  }, [olayIsle]);

  const ara = useCallback(async (metin: string) => {
    if (calisiyor.current) return;
    calisiyor.current = true;
    setDurum({ ...BOS, durum: 'yukleniyor' });
    try {
      const yanit = await fetch('/api/ara', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({ metin }),
      });
      const akis = yanit.headers.get('content-type')?.includes('text/event-stream');
      if (!akis || !yanit.body) {
        const z = (await yanit.json()) as Zarf<AramaVerisi>;
        setDurum({ ...BOS, durum: 'hata', hata: z.error ?? 'Bir şeyler ters gitti' });
        return;
      }
      await akisiOku(yanit.body);
      setDurum((d) => (d.durum === 'yukleniyor' ? { ...d, durum: 'hata', hata: 'Cevap yarım kaldı, tekrar dene.' } : d));
    } catch {
      setDurum({ ...BOS, durum: 'hata', hata: 'Bağlantı koptu, tekrar dene.' });
    } finally {
      calisiyor.current = false;
    }
  }, [akisiOku]);

  return { ...durum, ara };
}
