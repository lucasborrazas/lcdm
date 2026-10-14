import { NextRequest, NextResponse } from "next/server";
import { MODO_CLIENTE_COOKIE, esRutaOculta } from "@/lib/modoCliente";

// En modo cliente, las secciones con costos/ganancias redirigen a /pedidos
// (no alcanza con esconder el link del menu si alguien entra por URL).
// Ademas pasa el pathname al layout (x-pathname) para que redirija las
// secciones apagadas en Configuracion.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const modoCliente = req.cookies.get(MODO_CLIENTE_COOKIE)?.value === "1";
  if (modoCliente && esRutaOculta(pathname)) {
    return NextResponse.redirect(new URL("/pedidos", req.url));
  }
  const headers = new Headers(req.headers);
  headers.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Todas las paginas (no la API ni los archivos estaticos).
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
