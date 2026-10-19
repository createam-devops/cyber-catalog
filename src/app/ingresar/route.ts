import { NextResponse } from 'next/server';
import { erpLoginBase } from '@/lib/server/erp/signup';

export const dynamic = 'force-dynamic';

/**
 * «Ingresar» a Catálogo Digital: las tiendas se administran en CyberPOS, así
 * que lleva a su ingreso (el del ERP configurado). Sin ERP, al ingreso viejo.
 * La landing es estática: por eso la dirección se resuelve aquí y no allá.
 */
export function GET(request: Request) {
  return NextResponse.redirect(erpLoginBase() ?? new URL('/login', request.url), 302);
}
