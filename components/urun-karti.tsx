// Ürün kartı: katalog görseli (Trendyol CDN, hotlink), ad, fiyat, uyum rozeti, uymayan neden, mağaza linki.
import Image from 'next/image';
import type { Kart } from '@/lib/tipler';

function UyumRozeti({ etiket, yuzde }: { etiket: string; yuzde: number }) {
  const tam = etiket === 'Tam isabet';
  return (
    <span className={`inline-block px-2 py-1 font-mono text-xs ${tam ? 'vurgu-gradyan text-white' : 'border border-gri-3 text-koyu'}`}>
      {etiket} %{yuzde}
    </span>
  );
}

export default function UrunKarti({ kart }: { kart: Kart }) {
  return (
    <article className="flex flex-col border border-gri-1 bg-white">
      <div className="relative aspect-[3/4] bg-gri-1">
        <Image src={kart.gorsel} alt={kart.ad} fill unoptimized sizes="25vw" className="object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <UyumRozeti etiket={kart.uyumEtiketi} yuzde={kart.uyumYuzde} />
        <h3 className="line-clamp-2 text-sm leading-snug">{kart.ad}</h3>
        <p className="font-mono text-lg font-semibold">
          {kart.fiyat.toLocaleString('tr-TR')} {kart.paraBirimi === 'TRY' ? 'TL' : kart.paraBirimi}
        </p>
        {kart.nedenMetni ? <p className="text-xs text-soluk">Uymayan: {kart.nedenMetni.toLocaleLowerCase('tr-TR')}</p> : null}
        <a
          href={kart.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto pt-1 font-mono text-xs text-magenta underline-offset-2 hover:underline"
        >
          mağazada gör →
        </a>
      </div>
    </article>
  );
}
