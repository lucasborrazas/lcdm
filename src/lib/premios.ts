// Entrega de premios: precios del bono y cuentas del evento.

export const TURNOS_POR_DEFECTO = ["16:00", "16:40", "17:20", "18:00", "18:40"];

export const BONO_POR_DEFECTO = {
  precioTransferencia: 48000,
  // Descuento por pago en efectivo, en porcentaje.
  descuentoEfectivoPct: 15,
};

// Precio en efectivo = precio de transferencia menos el descuento, redondeado
// hacia abajo al millar (a favor del cliente). 48.000 - 15% = 40.800 -> 40.000.
export function precioEfectivoDesde(
  precioTransferencia: number,
  descuentoPct: number = BONO_POR_DEFECTO.descuentoEfectivoPct
): number {
  const conDescuento = (precioTransferencia * (100 - descuentoPct)) / 100;
  return Math.max(0, Math.floor(conDescuento / 1000) * 1000);
}

export type MetodoPago = "EFECTIVO" | "TRANSFERENCIA";

// Monto del bono segun como se paga; sin medio definido rige el precio de lista
// (transferencia).
export function montoBono(
  precios: { precioEfectivo: number; precioTransferencia: number },
  metodoPago: MetodoPago | null | undefined
): number {
  return metodoPago === "EFECTIVO" ? precios.precioEfectivo : precios.precioTransferencia;
}

export type Genero = "MASCULINO" | "FEMENINO";

type FamiliaCalculo = {
  turnoId: string;
  metodoPago: MetodoPago | null;
  monto: number;
  chicos: { genero: Genero }[];
};

export const familiaPago = (f: { metodoPago: MetodoPago | null }) => f.metodoPago !== null;

export function contarChicos(familias: { chicos: { genero: Genero }[] }[]) {
  let masculino = 0;
  let femenino = 0;
  for (const f of familias) {
    for (const c of f.chicos) {
      if (c.genero === "MASCULINO") masculino++;
      else femenino++;
    }
  }
  return { masculino, femenino, total: masculino + femenino };
}

export type ResumenTurno = {
  turnoId: string;
  chicos: number;
  masculino: number;
  femenino: number;
};

export function resumenPorTurno(turnoIds: string[], familias: FamiliaCalculo[]): ResumenTurno[] {
  return turnoIds.map((turnoId) => {
    const delTurno = familias.filter((f) => f.turnoId === turnoId);
    const chicos = contarChicos(delTurno);
    return {
      turnoId,
      chicos: chicos.total,
      masculino: chicos.masculino,
      femenino: chicos.femenino,
    };
  });
}

export type TotalesEntrega = {
  familias: number;
  familiasPagaron: number;
  chicos: number;
  masculino: number;
  femenino: number;
  // Una copa por chico inscripto.
  copas: number;
  cobrado: number;
  cobradoEfectivo: number;
  cobradoTransferencia: number;
  pendiente: number;
  gastos: number;
  ganancia: number;
};

export function totalesEntrega(familias: FamiliaCalculo[], gastos: { monto: number }[]): TotalesEntrega {
  const chicos = contarChicos(familias);
  const cobradoEfectivo = familias
    .filter((f) => f.metodoPago === "EFECTIVO")
    .reduce((s, f) => s + f.monto, 0);
  const cobradoTransferencia = familias
    .filter((f) => f.metodoPago === "TRANSFERENCIA")
    .reduce((s, f) => s + f.monto, 0);
  const cobrado = cobradoEfectivo + cobradoTransferencia;
  const pendiente = familias.filter((f) => !familiaPago(f)).reduce((s, f) => s + f.monto, 0);
  const totalGastos = gastos.reduce((s, g) => s + g.monto, 0);
  return {
    familias: familias.length,
    familiasPagaron: familias.filter(familiaPago).length,
    chicos: chicos.total,
    masculino: chicos.masculino,
    femenino: chicos.femenino,
    copas: chicos.total,
    cobrado,
    cobradoEfectivo,
    cobradoTransferencia,
    pendiente,
    gastos: totalGastos,
    ganancia: cobrado - totalGastos,
  };
}

export function nombreGenero(genero: Genero): string {
  return genero === "MASCULINO" ? "Masculino" : "Femenino";
}

// Para sugerir familias ya cargadas mientras se escribe un nombre.
export function normalizarNombre(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function sugerirFamilias<T extends { nombre: string }>(familias: T[], escrito: string, max = 3): T[] {
  const q = normalizarNombre(escrito);
  if (q.length < 2) return [];
  return familias.filter((f) => normalizarNombre(f.nombre).includes(q)).slice(0, max);
}
