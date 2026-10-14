import {
  minimoPersonas,
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

describe("minimoPersonas", () => {
  it("nunca baja de la cantidad de chicos", () => {
    expect(minimoPersonas(3)).toBe(3);
    expect(minimoPersonas(0)).toBe(1);
  });
});

const fam = (
  turnoId: string,
  personas: number,
  metodoPago: "EFECTIVO" | "TRANSFERENCIA" | null,
  monto: number,
  generos: ("MASCULINO" | "FEMENINO")[]
) => ({ turnoId, totalPersonas: personas, metodoPago, monto, chicos: generos.map((genero) => ({ genero })) });

describe("resumenPorTurno", () => {
  it("cuenta familias, chicos por genero y personas de cada turno", () => {
    const familias = [
      fam("a", 5, "EFECTIVO", 40000, ["MASCULINO", "FEMENINO"]), // hermanos, un bono
      fam("a", 3, null, 48000, ["FEMENINO"]),
      fam("b", 4, "TRANSFERENCIA", 48000, ["MASCULINO"]),
    ];
    expect(resumenPorTurno(["a", "b", "c"], familias)).toEqual([
      { turnoId: "a", familias: 2, chicos: 3, masculino: 1, femenino: 2, personas: 8 },
      { turnoId: "b", familias: 1, chicos: 1, masculino: 1, femenino: 0, personas: 4 },
      { turnoId: "c", familias: 0, chicos: 0, masculino: 0, femenino: 0, personas: 0 },
    ]);
  });
});

describe("totalesEntrega", () => {
  const familias = [
    fam("a", 5, "EFECTIVO", 40000, ["MASCULINO", "FEMENINO"]),
    fam("a", 3, null, 48000, ["FEMENINO"]),
    fam("b", 4, "TRANSFERENCIA", 48000, ["MASCULINO"]),
    fam("b", 2, "EFECTIVO", 35000, ["FEMENINO"]), // bono con excepcion
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
  it("copas = chicos, segmentados por genero; personas incluye a todos", () => {
    expect(t.chicos).toBe(5);
    expect(t.copas).toBe(5);
    expect(t.masculino).toBe(2);
    expect(t.femenino).toBe(3);
    expect(t.personas).toBe(14);
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
