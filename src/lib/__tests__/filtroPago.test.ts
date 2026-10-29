import { contarPorPago, filtrarPorPago } from "../filtroPago";

// Familias de Entrega de premios: pagaron si tienen medio de pago.
const familias = [
  { nombre: "A", metodoPago: "EFECTIVO" },
  { nombre: "B", metodoPago: null },
  { nombre: "C", metodoPago: "TRANSFERENCIA" },
];
const pago = (f: { metodoPago: string | null }) => f.metodoPago !== null;

describe("filtrarPorPago", () => {
  it("separa sin pagar y pagaron segun el criterio de cada seccion", () => {
    expect(filtrarPorPago(familias, "sin", pago).map((f) => f.nombre)).toEqual(["B"]);
    expect(filtrarPorPago(familias, "pagaron", pago).map((f) => f.nombre)).toEqual(["A", "C"]);
    expect(filtrarPorPago(familias, "todos", pago)).toHaveLength(3);
  });
});

describe("contarPorPago", () => {
  it("cuenta cada opcion", () => {
    expect(contarPorPago(familias, pago)).toEqual({ todos: 3, sin: 1, pagaron: 2 });
    expect(contarPorPago([], pago)).toEqual({ todos: 0, sin: 0, pagaron: 0 });
  });
});
