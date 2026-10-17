// Tipografías que puede elegir una tienda (ver font-ids.ts). Se declaran sin
// precarga: el navegador solo descarga las que la tienda usa de verdad.

import { Days_One, DM_Sans, Inter, Nunito, Oswald, Outfit, Playfair_Display, Poppins } from 'next/font/google';
import type { FontId } from './font-ids';

const daysOne = Days_One({ weight: '400', subsets: ['latin'], display: 'swap', preload: false, variable: '--sf-font-days-one' });
const outfit = Outfit({ subsets: ['latin'], display: 'swap', preload: false, variable: '--sf-font-outfit' });
const inter = Inter({ subsets: ['latin'], display: 'swap', preload: false, variable: '--sf-font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], display: 'swap', preload: false, variable: '--sf-font-playfair' });
const dmSans = DM_Sans({ subsets: ['latin'], display: 'swap', preload: false, variable: '--sf-font-dm-sans' });
const poppins = Poppins({ weight: ['400', '600', '700', '800'], subsets: ['latin'], display: 'swap', preload: false, variable: '--sf-font-poppins' });
const nunito = Nunito({ subsets: ['latin'], display: 'swap', preload: false, variable: '--sf-font-nunito' });
const oswald = Oswald({ subsets: ['latin'], display: 'swap', preload: false, variable: '--sf-font-oswald' });

const FONT_CLASSNAMES: Record<FontId, string> = {
  'days-one': daysOne.variable,
  outfit: outfit.variable,
  inter: inter.variable,
  playfair: playfair.variable,
  'dm-sans': dmSans.variable,
  poppins: poppins.variable,
  nunito: nunito.variable,
  oswald: oswald.variable,
};

/** Clases que declaran las variables de todas las tipografías; van en la raíz de la tienda. */
export const STOREFRONT_FONT_CLASSNAMES = Object.values(FONT_CLASSNAMES).join(' ');
