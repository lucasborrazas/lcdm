import { MetodoPago } from "@/generated/prisma/client";

// ── Talles ─────────────────────────────────────────────────────────────────────

const ORDEN_TALLES_LETRA = ["XS", "S", "M", "L", "XL", "XXL"];

/**
 * Compara dos talles: primero los numéricos (de menor a mayor), después los
 * de letra en su orden natural (XS, S, M, L...). Cualquier otra cosa queda
 * al final, ordenada alfabéticamente.
 */
export function compararTalles(a: string, b: string): number {
  const numA = /^\d+$/.test(a.trim());
  const numB = /^\d+$/.test(b.trim());

  if (numA && numB) return parseInt(a) - parseInt(b);
  if (numA && !numB) return -1;
  if (!numA && numB) return 1;

  const idxA = ORDEN_TALLES_LETRA.indexOf(a.trim().toUpperCase());
  const idxB = ORDEN_TALLES_LETRA.indexOf(b.trim().toUpperCase());
  if (idxA !== -1 && idxB !== -1) return idxA - idxB;
  if (idxA !== -1) return -1;
  if (idxB !== -1) return 1;
  return a.localeCompare(b);
}

// ── Precios ────────────────────────────────────────────────────────────────────

// 15% de descuento, redondeado al millar superior (el redondeo favorece al
// vendedor). Se usa aritmetica entera para que un resultado exacto en miles
// no se corra por error de punto flotante.
export function calcularPrecioEfectivo(precioVenta: number): number {
  return Math.ceil((precioVenta * 85) / 100000) * 1000;
}

export function calcularPrecioUnitario(
  precioVenta: number,
  metodoPago: MetodoPago
): number {
  return metodoPago === "EFECTIVO"
    ? calcularPrecioEfectivo(precioVenta)
    : precioVenta;
}

export function calcularPrecioConDescuento(
  precioBase: number,
  descuentoPct: number
): number {
  return Math.round(precioBase * (1 - descuentoPct / 100));
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

export type LineaCompraEntrada = {
  productoId: string;
  cantidad: number;
  costoUnitarioCompra?: number;
  totalLineaCompra?: number;
};

export type LineaCompraCalculada = {
  productoId: string;
  cantidad: number;
  totalLineaCompra?: number;
  costoUnitarioCompra: number | null;
  subtotalLinea: number;
  costoEnvioUnitario: number;
  costoUnitarioReal: number;
};

/**
 * Toma las líneas de una compra (tal como las manda el formulario) y
 * devuelve, por línea, el costo unitario real final — contemplando el modo
 * "valor general de la compra" (mismo costo por unidad en toda la compra,
 * en vez de uno por línea) y el prorrateo de envío. La usan tanto crear
 * como editar una compra, para no duplicar esta cuenta en dos lugares.
 */
export function calcularLineasCompra(
  lineas: LineaCompraEntrada[],
  envioTotalCompra: number | null | undefined,
  valorGeneralCompra: number | null | undefined
): LineaCompraCalculada[] {
  let lineasEntrada = lineas;
  if (valorGeneralCompra != null) {
    const totalUnidades = lineas.reduce((sum, l) => sum + l.cantidad, 0);
    const costoUnitarioParejo = totalUnidades > 0 ? Math.round(valorGeneralCompra / totalUnidades) : 0;
    lineasEntrada = lineas.map((l) => ({
      ...l,
      costoUnitarioCompra: costoUnitarioParejo,
      totalLineaCompra: undefined,
    }));
  }

  const lineasCalculadas = lineasEntrada.map((linea) => {
    let costoUnitarioCompra = linea.costoUnitarioCompra ?? null;
    if (linea.totalLineaCompra != null) {
      costoUnitarioCompra = calcularCostoUnitarioCompra(linea.totalLineaCompra, linea.cantidad);
    }
    const subtotalLinea = calcularSubtotalLinea(
      linea.totalLineaCompra ?? null,
      linea.cantidad,
      costoUnitarioCompra ?? 0
    );
    return { ...linea, costoUnitarioCompra, subtotalLinea };
  });

  const costosEnvio =
    envioTotalCompra != null
      ? distribuirEnvioProporcional(lineasCalculadas, envioTotalCompra)
      : lineasCalculadas.map(() => 0);

  return lineasCalculadas.map((linea, i) => {
    const costoEnvioUnitario = costosEnvio[i];
    return {
      ...linea,
      costoEnvioUnitario,
      costoUnitarioReal: calcularCostoUnitarioReal(linea.costoUnitarioCompra ?? 0, costoEnvioUnitario),
    };
  });
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
