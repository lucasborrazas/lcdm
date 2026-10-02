import { replayCosto, type EventoCosto } from "../recalculoCosto";

describe("replayCosto", () => {
  it("un solo ingreso sobre stock en cero reemplaza el costo directo", () => {
    const eventos: EventoCosto[] = [
      { tipo: "INGRESO", ts: 1, movimientoId: "m1", cantidad: 10, costoUnitarioReal: 1000 },
    ];
    const r = replayCosto(0, null, eventos);
    expect(r).toEqual({ stock: 10, costo: 1000 });
  });

  it("dos ingresos promedian ponderado por cantidad", () => {
    const eventos: EventoCosto[] = [
      { tipo: "INGRESO", ts: 1, movimientoId: "m1", cantidad: 10, costoUnitarioReal: 1000 },
      { tipo: "INGRESO", ts: 2, movimientoId: "m2", cantidad: 10, costoUnitarioReal: 2000 },
    ];
    const r = replayCosto(0, null, eventos);
    // (10*1000 + 10*2000) / 20 = 1500
    expect(r).toEqual({ stock: 20, costo: 1500 });
  });

  it("un egreso entre dos ingresos no cambia el costo, solo el stock", () => {
    const eventos: EventoCosto[] = [
      { tipo: "INGRESO", ts: 1, movimientoId: "m1", cantidad: 10, costoUnitarioReal: 1000 },
      { tipo: "EGRESO", ts: 2, movimientoId: "m2", cantidad: 5 },
      { tipo: "INGRESO", ts: 3, movimientoId: "m3", cantidad: 5, costoUnitarioReal: 3000 },
    ];
    const r = replayCosto(0, null, eventos);
    // tras el egreso quedan 5 u a 1000; + 5 u a 3000 => (5*1000+5*3000)/10 = 2000
    expect(r).toEqual({ stock: 10, costo: 2000 });
  });

  it("vender todo el stock antes del siguiente ingreso hace que ese ingreso reemplace el costo", () => {
    const eventos: EventoCosto[] = [
      { tipo: "INGRESO", ts: 1, movimientoId: "m1", cantidad: 10, costoUnitarioReal: 1000 },
      { tipo: "PEDIDO", ts: 2, pedidoId: "p1", cantidad: 10 },
      { tipo: "INGRESO", ts: 3, movimientoId: "m2", cantidad: 4, costoUnitarioReal: 5000 },
    ];
    const r = replayCosto(0, null, eventos);
    expect(r).toEqual({ stock: 4, costo: 5000 });
  });

  it("un cambio manual pisa el costo sin tocar el stock", () => {
    const eventos: EventoCosto[] = [
      { tipo: "INGRESO", ts: 1, movimientoId: "m1", cantidad: 10, costoUnitarioReal: 1000 },
      { tipo: "MANUAL", ts: 2, costoNuevo: 7000 },
    ];
    const r = replayCosto(0, null, eventos);
    expect(r).toEqual({ stock: 10, costo: 7000 });
  });

  it("respeta el orden cronológico real, no el orden del array", () => {
    const eventos: EventoCosto[] = [
      { tipo: "INGRESO", ts: 3, movimientoId: "m2", cantidad: 10, costoUnitarioReal: 2000 },
      { tipo: "INGRESO", ts: 1, movimientoId: "m1", cantidad: 10, costoUnitarioReal: 1000 },
    ];
    const r = replayCosto(0, null, eventos);
    expect(r).toEqual({ stock: 20, costo: 1500 });
  });

  it("excluir un movimiento (simulando borrar una compra) cambia el resultado", () => {
    const eventos: EventoCosto[] = [
      { tipo: "INGRESO", ts: 1, movimientoId: "m1", cantidad: 10, costoUnitarioReal: 1000 },
      { tipo: "INGRESO", ts: 2, movimientoId: "m2", cantidad: 10, costoUnitarioReal: 2000 },
    ];
    // simula excluir m2: solo queda el primer ingreso
    const sinM2 = eventos.filter((e) => "movimientoId" in e && e.movimientoId !== "m2");
    const r = replayCosto(0, null, sinM2);
    expect(r).toEqual({ stock: 10, costo: 1000 });
  });

  it("usa stockInicial y costoSemilla como punto de partida", () => {
    const eventos: EventoCosto[] = [
      { tipo: "INGRESO", ts: 1, movimientoId: "m1", cantidad: 10, costoUnitarioReal: 3000 },
    ];
    const r = replayCosto(10, 1000, eventos);
    // (10*1000 + 10*3000) / 20 = 2000
    expect(r).toEqual({ stock: 20, costo: 2000 });
  });

  it("agregar eventos adicionales al final simula una compra nueva (edicion)", () => {
    const historicos: EventoCosto[] = [
      { tipo: "INGRESO", ts: 1, movimientoId: "m1", cantidad: 10, costoUnitarioReal: 1000 },
    ];
    const nuevos: EventoCosto[] = [
      { tipo: "INGRESO", ts: 2, movimientoId: "nuevo", cantidad: 10, costoUnitarioReal: 5000 },
    ];
    const r = replayCosto(0, null, [...historicos, ...nuevos]);
    expect(r).toEqual({ stock: 20, costo: 3000 });
  });
});
