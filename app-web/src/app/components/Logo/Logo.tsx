import Image from 'next/image';

/** Source asset is 554×354; layout size keeps ~2× headroom for sharp display on retina. */
const SOURCE_W = 554;
const SOURCE_H = 354;
const LOGO_WIDTH = 320;
const LOGO_HEIGHT = Math.round((LOGO_WIDTH * SOURCE_H) / SOURCE_W);

export default function Logo() {
  return (
    <Image
      src="/logo.png"
      alt="Vendlyhub logo"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      priority
      sizes="(max-width: 600px) min(85vw, 320px), 320px"
      style={{ width: '100%', maxWidth: LOGO_WIDTH, height: 'auto' }}
    />
  );
}
