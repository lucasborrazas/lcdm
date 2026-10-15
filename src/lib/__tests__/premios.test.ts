import {
  montoBono,
  precioEfectivoDesde,
  resumenPorTurno,
  sugerirFamilias,
  totalesEntrega,
} from "../premios";

describe("precioEfectivoDesde", () => {
  it("48.000 con 15% de descuento queda en 40.000 (redondeo al millar hacia abajo)", () => {
    expect(precioEfectivoDesde(48000, 15)).toBe(40000);
  });
  it("usa 15% por defecto", () => {
    expect(precioEfectivoDesde(48000)).toBe(40000);
  });
  it("redondea siempre a favor del cliente", () => {
    expect(precioEfectivoDesde(48000, 20)).toBe(38000); // 38.400
    expect(precioEfectivoDesde(50000, 10)).toBe(45000); // exacto
    expect(precioEfectivoDesde(49999, 0)).toBe(49000);
  });
  it("sin precio no da negativos", () => {
    expect(precioEfectivoDesde(0, 15)).toBe(0);
  });
});

describe("montoBono", () => {
  const precios = { precioEfectivo: 40000, precioTransferencia: 48000 };
  it("elige el precio segun el medio", () => {
    expect(montoBono(precios, "EFECTIVO")).toBe(40000);
    expect(montoBono(precios, "TRANSFERENCIA")).toBe(48000);
  });
  it("sin medio rige el precio de lista", () => {
    expect(montoBono(precios, null)).toBe(48000);
  });
});

const fam = (
  turnoId: string,
  metodoPago: "EFECTIVO" | "TRANSFERENCIA" | null,
  monto: number,
  generos: ("MASCULINO" | "FEMENINO")[]
) => ({ turnoId, metodoPago, monto, chicos: generos.map((genero) => ({ genero })) });

describe("resumenPorTurno", () => {
  it("cuenta chicos por genero de cada turno", () => {
    const familias = [
      fam("a", "EFECTIVO", 40000, ["MASCULINO", "FEMENINO"]), // hermanos, un bono
      fam("a", null, 48000, ["FEMENINO"]),
      fam("b", "TRANSFERENCIA", 48000, ["MASCULINO"]),
    ];
    expect(resumenPorTurno(["a", "b", "c"], familias)).toEqual([
      { turnoId: "a", chicos: 3, masculino: 1, femenino: 2 },
      { turnoId: "b", chicos: 1, masculino: 1, femenino: 0 },
      { turnoId: "c", chicos: 0, masculino: 0, femenino: 0 },
    ]);
  });
});

describe("totalesEntrega", () => {
  const familias = [
    fam("a", "EFECTIVO", 40000, ["MASCULINO", "FEMENINO"]),
    fam("a", null, 48000, ["FEMENINO"]),
    fam("b", "TRANSFERENCIA", 48000, ["MASCULINO"]),
    fam("b", "EFECTIVO", 35000, ["FEMENINO"]), // bono con excepcion
  ];
  const t = totalesEntrega(familias, [{ monto: 30000 }, { monto: 10000 }]);

  it("un bono por familia: hermanos no suman otro bono", () => {
    expect(t.familias).toBe(4);
    expect(t.cobrado).toBe(40000 + 48000 + 35000);
  });
  it("separa efectivo, transferencia y pendiente", () => {
    expect(t.cobradoEfectivo).toBe(75000);
    expect(t.cobradoTransferencia).toBe(48000);
    expect(t.pendiente).toBe(48000);
    expect(t.familiasPagaron).toBe(3);
  });
  it("ganancia = cobrado - gastos", () => {
    expect(t.gastos).toBe(40000);
    expect(t.ganancia).toBe(123000 - 40000);
  });
  it("copas = chicos, segmentados por genero", () => {
    expect(t.chicos).toBe(5);
    expect(t.copas).toBe(5);
    expect(t.masculino).toBe(2);
    expect(t.femenino).toBe(3);
  });
  it("sin datos da todo en cero", () => {
    expect(totalesEntrega([], [])).toMatchObject({ familias: 0, cobrado: 0, ganancia: 0, chicos: 0 });
  });
});

describe("sugerirFamilias", () => {
  const lista = [{ nombre: "Pérez" }, { nombre: "González Peralta" }, { nombre: "Rossi" }];
  it("ignora tildes y mayusculas", () => {
    expect(sugerirFamilias(lista, "perez")).toEqual([{ nombre: "Pérez" }]);
    expect(sugerirFamilias(lista, "PER").map((f) => f.nombre)).toEqual(["Pérez", "González Peralta"]);
  });
  it("no sugiere con menos de 2 letras", () => {
    expect(sugerirFamilias(lista, "p")).toEqual([]);
  });
});
