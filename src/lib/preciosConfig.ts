// Precios por defecto que se precargan al crear un torneo o una entrega nueva
// (se editan en Configuracion).

export type PreciosConfig = {
  torneoEfectivo: number;
  torneoTransferencia: number;
  bonoTransferencia: number;
  // Descuento del bono por pago en efectivo, en porcentaje.
  bonoDescuentoEfectivoPct: number;
};

export const PRECIOS_POR_DEFECTO: PreciosConfig = {
  torneoEfectivo: 18000,
  torneoTransferencia: 22000,
  bonoTransferencia: 48000,
  bonoDescuentoEfectivoPct: 15,
};
