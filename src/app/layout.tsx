import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { ModoClienteProvider } from "@/components/layout/ModoClienteProvider";
import { ConfiguracionProvider } from "@/components/layout/ConfiguracionProvider";
import { MODO_CLIENTE_COOKIE } from "@/lib/modoCliente";
import { leerConfigSecciones } from "@/lib/configuracion";
import { redireccionSeccionApagada } from "@/lib/secciones";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ToastProvider } from "@/components/mobile/ToastUndo";
import { MobileTopBar } from "@/components/mobile/MobileTopBar";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Inventario LCDM",
  description: "Gestión de inventario, pedidos y stock",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const modoCliente = cookies().get(MODO_CLIENTE_COOKIE)?.value === "1";
  const secciones = await leerConfigSecciones();

  // Una seccion apagada en Configuracion no se puede abrir ni por URL
  // (el middleware pasa el pathname en este header).
  const pathname = headers().get("x-pathname");
  const destino = pathname ? redireccionSeccionApagada(pathname, secciones) : null;
  if (destino) redirect(destino);

  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="h-full bg-background text-foreground">
        <ConfiguracionProvider secciones={secciones}>
          <ModoClienteProvider inicial={modoCliente}>
            <ToastProvider>
              <div className="flex h-full">
                <Navbar />
                <main className="flex-1 overflow-auto pb-28 md:pb-0 md:pl-56">
                  <div className="max-w-7xl mx-auto p-4 md:p-6">
                    <MobileTopBar />
                    {children}
                  </div>
                </main>
              </div>
              <Suspense fallback={null}>
                <BottomNav />
              </Suspense>
            </ToastProvider>
          </ModoClienteProvider>
        </ConfiguracionProvider>
      </body>
    </html>
  );
}
