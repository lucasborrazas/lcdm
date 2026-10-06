"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MODO_CLIENTE_COOKIE, esRutaOculta } from "@/lib/modoCliente";

type ModoClienteCtx = { modoCliente: boolean; toggle: () => void };

const Ctx = createContext<ModoClienteCtx>({ modoCliente: false, toggle: () => {} });

export function ModoClienteProvider({
  inicial,
  children,
}: {
  inicial: boolean;
  children: React.ReactNode;
}) {
  const [modoCliente, setModoCliente] = useState(inicial);
  const pathname = usePathname();
  const router = useRouter();

  const toggle = useCallback(() => {
    const nuevo = !modoCliente;
    // Cookie (y no localStorage) para que el middleware y el server la lean
    // y no haya un parpadeo de costos al recargar.
    document.cookie = `${MODO_CLIENTE_COOKIE}=${nuevo ? "1" : ""}; path=/; max-age=${
      nuevo ? 60 * 60 * 24 * 365 : 0
    }; SameSite=Lax`;
    setModoCliente(nuevo);
    if (nuevo && esRutaOculta(pathname)) router.replace("/pedidos");
  }, [modoCliente, pathname, router]);

  return <Ctx.Provider value={{ modoCliente, toggle }}>{children}</Ctx.Provider>;
}

export function useModoCliente() {
  return useContext(Ctx);
}
