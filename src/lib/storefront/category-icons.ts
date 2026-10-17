// Ícono sugerido para una categoría a partir de su nombre. Las categorías del
// ERP no traen ícono; así "Ramos" sale con una flor y "Herramientas" con una
// llave sin que nadie lo configure. Devuelve un nombre de STOREFRONT_ICONS.

import type { StorefrontIconName } from './icons';

const RULES: Array<[RegExp, StorefrontIconName]> = [
  [/ramo|flor|rosa|girasol/, 'Flower2'],
  [/desayuno|cafe|cafeteria/, 'Coffee'],
  [/peluche|amor|enamorad/, 'Heart'],
  [/caja|box|regalo|sorpresa|detalle/, 'Gift'],
  [/globo|fiesta|cumple/, 'Sparkles'],
  [/cuadro|foto|marco|retrato/, 'Camera'],
  [/personaliz|arte|diseno/, 'Palette'],
  [/vestido|blusa|polo|camisa|ropa|mujer|hombre|nino|nina/, 'Shirt'],
  [/zapat|calzado|sandalia/, 'Footprints'],
  [/reloj|accesorio|joya|collar|arete/, 'Watch'],
  [/belleza|maquillaje|cosmetic|skincare|perfume/, 'Sparkles'],
  [/torta|postre|pastel|dulce|helado/, 'Cake'],
  [/bebida|jugo|gaseosa|chicha|limonada/, 'CupSoda'],
  [/pizza|combo|compartir/, 'Pizza'],
  [/plato|comida|menu|almuerzo|carta/, 'UtensilsCrossed'],
  [/herramienta|taladro|llave/, 'Wrench'],
  [/electric|cable|foco|ilumina/, 'Zap'],
  [/gasfit|tuberia|agua|sanitari/, 'Droplet'],
  [/pintura|brocha/, 'PaintBucket'],
  [/tecnolog|computo|laptop|celular|electronic/, 'Cpu'],
  [/seguridad|proteccion/, 'Shield'],
  [/mascota|perro|gato/, 'Dog'],
  [/hogar|casa|mueble/, 'Home'],
  [/libro|util|escolar/, 'Book'],
];

export function guessCategoryIcon(name: string): StorefrontIconName {
  const text = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
  return RULES.find(([pattern]) => pattern.test(text))?.[1] ?? 'Package';
}
