import {
  filtrarBase,
  aplicarFiltroPago,
  contadoresPago,
  kpisCobro,
  textoCupo,
} from "../inscripcionesMobile";

const lista = [
  { nombre: "Ana Pérez", pago: true, monto: 18000, horarioId: "h1" },
  { nombre: "Beto Gómez", pago: false, monto: null, horarioId: "h1" },
  { nombre: "Ana Ríos", pago: false, monto: null, horarioId: "h2" },
  { nombre: "Lola Díaz", pago: true, monto: 22000, horarioId: "h2" },
];

describe("filtrarBase", () => {
  it("sin filtros devuelve todo", () => {
    expect(filtrarBase(lista, { q: "", horarioId: "all" })).toHaveLength(4);
  });
  it("filtra por nombre sin importar mayúsculas ni espacios", () => {
    expect(filtrarBase(lista, { q: "  ANA ", horarioId: "all" })).toHaveLength(2);
  });
  it("filtra por horario", () => {
    expect(filtrarBase(lista, { q: "", horarioId: "h2" })).toHaveLength(2);
  });
  it("combina nombre y horario", () => {
    const r = filtrarBase(lista, { q: "ana", horarioId: "h2" });
    expect(r.map((i) => i.nombre)).toEqual(["Ana Ríos"]);
  });
});

describe("aplicarFiltroPago / contadoresPago", () => {
  it("separa pagaron y sin pagar", () => {
    expect(aplicarFiltroPago(lista, "pagaron")).toHaveLength(2);
    expect(aplicarFiltroPago(lista, "sin")).toHaveLength(2);
    expect(aplicarFiltroPago(lista, "todos")).toHaveLength(4);
  });
  it("cuenta cada grupo", () => {
    expect(contadoresPago(lista)).toEqual({ todos: 4, sin: 2, pagaron: 2 });
  });
});

describe("kpisCobro", () => {
  it("suma lo cobrado y estima lo pendiente al precio en efectivo", () => {
    expect(kpisCobro(lista, 18000)).toEqual({
      cobrado: 40000,
      nPagaron: 2,
      nTotal: 4,
      nSin: 2,
      pendiente: 36000,
    });
  });
  it("lista vacía", () => {
    expect(kpisCobro([], 18000).pendiente).toBe(0);
  });
});

describe("textoCupo", () => {
  it("sin cupo muestra solo los inscriptos", () => {
    expect(textoCupo(5, null)).toBe("5");
  });
  it("con cupo muestra n/cupo", () => {
    expect(textoCupo(5, 10)).toBe("5/10");
  });
  it("lleno", () => {
    expect(textoCupo(10, 10)).toBe("Lleno");
    expect(textoCupo(12, 10)).toBe("Lleno");
  });
});
