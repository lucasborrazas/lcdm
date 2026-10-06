import { NextRequest, NextResponse } from "next/server";
import { MODO_CLIENTE_COOKIE, esRutaOculta } from "@/lib/modoCliente";

// En modo cliente, las secciones con costos/ganancias redirigen a /pedidos
// (no alcanza con esconder el link del menu si alguien entra por URL).
export function middleware(req: NextRequest) {
  const modoCliente = req.cookies.get(MODO_CLIENTE_COOKIE)?.value === "1";
  if (modoCliente && esRutaOculta(req.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/pedidos", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/historial/:path*", "/movimientos/:path*", "/torneo/resumen/:path*", "/torneo/historial/:path*"],
};
