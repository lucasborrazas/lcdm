import { MetodoPago } from "@/generated/prisma/client";

// ── Precios ────────────────────────────────────────────────────────────────────

export function calcularPrecioEfectivo(precioVenta: number): number {
  return Math.floor((precioVenta * 0.85) / 1000) * 1000;
}

export function calcularPrecioUnitario(
  precioVenta: number,
  metodoPago: MetodoPago
): number {
  return metodoPago === "EFECTIVO"
    ? calcularPrecioEfectivo(precioVenta)
    : precioVenta;
}

// ── Pedidos ───────────────────────────────────────────────────────────────────

export function calcularCostoTotal(
  cantidad: number,
  costoUnitario: number
): number {
  return cantidad * costoUnitario;
}

export function calcularPrecioTotal(
  cantidad: number,
  precioUnitario: number
): number {
  return cantidad * precioUnitario;
}

export function calcularGanancia(
  precioTotal: number,
  costoTotal: number
): number {
  return precioTotal - costoTotal;
}

export function calcularSaldoRestante(
  precioTotal: number,
  sena: number
): number {
  return precioTotal - sena;
}

export function calcularGananciaUnitaria(
  precioVenta: number,
  costoActual: number
): number {
  return precioVenta - costoActual;
}

// ── Compras / movimientos ─────────────────────────────────────────────────────

export function calcularCostoUnitarioCompra(
  totalLineaCompra: number,
  cantidad: number
): number {
  if (cantidad === 0) return 0;
  return Math.round(totalLineaCompra / cantidad);
}

export function calcularSubtotalLinea(
  totalLineaCompra: number | null | undefined,
  cantidad: number,
  costoUnitarioCompra: number
): number {
  return totalLineaCompra != null
    ? totalLineaCompra
    : cantidad * costoUnitarioCompra;
}

/**
 * Distribuye el costo de envío de una compra entre líneas proporcionalmente
 * según el subtotal de cada línea.
 *
 * Retorna un array del mismo orden con el costoEnvioUnitario por línea.
 */
export function distribuirEnvioProporcional(
  lineas: Array<{ subtotalLinea: number; cantidad: number }>,
  envioTotal: number
): number[] {
  const totalSubtotal = lineas.reduce((sum, l) => sum + l.subtotalLinea, 0);

  if (totalSubtotal === 0) {
    const envioParejo = Math.round(envioTotal / lineas.length);
    return lineas.map((l) =>
      l.cantidad > 0 ? Math.round(envioParejo / l.cantidad) : 0
    );
  }

  return lineas.map((l) => {
    const envioProporcional = (l.subtotalLinea / totalSubtotal) * envioTotal;
    return l.cantidad > 0 ? Math.round(envioProporcional / l.cantidad) : 0;
  });
}

export function calcularCostoUnitarioReal(
  costoUnitarioCompra: number,
  costoEnvioUnitario: number
): number {
  return costoUnitarioCompra + costoEnvioUnitario;
}

/**
 * Promedia el costo actual del stock existente con el de una compra nueva,
 * ponderado por cantidades. Si no hay stock previo o costo previo, el costo
 * nuevo reemplaza directamente (no tiene sentido diluir contra stock/costo 0).
 */
export function calcularCostoPromedioPonderado(
  stockActual: number,
  costoActual: number | null,
  cantidadNueva: number,
  costoNuevo: number
): number {
  if (stockActual <= 0 || costoActual == null) return costoNuevo;
  const valorActual = stockActual * costoActual;
  const valorNuevo = cantidadNueva * costoNuevo;
  return Math.round((valorActual + valorNuevo) / (stockActual + cantidadNueva));
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function calcularMargen(
  gananciaTotal: number,
  totalVendido: number
): number {
  if (totalVendido === 0) return 0;
  return Math.round((gananciaTotal / totalVendido) * 100);
}

// ── Períodos ──────────────────────────────────────────────────────────────────

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

export function fechaAPeriodo(fecha: Date): string {
  const mes = MESES[fecha.getMonth()];
  const anio = fecha.getFullYear();
  return `${mes} ${anio}`;
}

export function periodoActual(): string {
  return fechaAPeriodo(new Date());
}

// ── Formato moneda ────────────────────────────────────────────────────────────

export function formatearMoneda(valor: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor);
}

// ── Formato fecha ─────────────────────────────────────────────────────────────

export function formatearFecha(fecha: Date | string): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const anio = d.getFullYear();
  return `${dia}/${mes}/${anio}`;
}
