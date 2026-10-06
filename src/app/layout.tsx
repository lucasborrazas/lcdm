import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { ModoClienteProvider } from "@/components/layout/ModoClienteProvider";
import { MODO_CLIENTE_COOKIE } from "@/lib/modoCliente";
import { cookies } from "next/headers";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Inventario LCDM",
  description: "Gestión de inventario, pedidos y stock",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const modoCliente = cookies().get(MODO_CLIENTE_COOKIE)?.value === "1";

  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="h-full bg-background text-foreground">
        <ModoClienteProvider inicial={modoCliente}>
          <div className="flex h-full">
            <Navbar />
            <main className="flex-1 overflow-auto pb-20 md:pb-0 md:pl-56">
              <div className="max-w-7xl mx-auto p-4 md:p-6">{children}</div>
            </main>
          </div>
          <BottomNav />
        </ModoClienteProvider>
      </body>
    </html>
  );
}
