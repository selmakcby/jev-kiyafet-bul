// SSE metin parçalarını olaylara ayırır (istemci tarafı, saf fonksiyon).
export type AkisOlayi = Readonly<{ tur: string; veri: unknown }>;

export function akisParcala(tampon: string): Readonly<{ olaylar: readonly AkisOlayi[]; kalan: string }> {
  const bloklar = tampon.split('\n\n');
  const kalan = bloklar.at(-1) ?? '';
  const olaylar = bloklar.slice(0, -1).flatMap((blok) => {
    const satirlar = blok.split('\n');
    const tur = satirlar.find((s) => s.startsWith('event: '))?.slice(7) ?? 'message';
    const veri = satirlar.filter((s) => s.startsWith('data: ')).map((s) => s.slice(6)).join('\n');
    if (!veri) return [];
    try {
      return [{ tur, veri: JSON.parse(veri) as unknown }];
    } catch {
      return [];
    }
  });
  return { olaylar, kalan };
}
