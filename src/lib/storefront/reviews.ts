// Opiniones de clientes tal como las muestra la vitrina (sin datos internos).

export interface PublicReview {
  id: number;
  rating: number;
  name: string;
  text: string;
  /** AAAA-MM-DD. */
  date: string;
}

export interface RatingSummary {
  /** Promedio con un decimal. */
  average: number;
  count: number;
}

/** «4,8» con coma decimal, como se escribe en Perú. */
export function formatRating(value: number): string {
  return value.toFixed(1).replace('.', ',');
}
