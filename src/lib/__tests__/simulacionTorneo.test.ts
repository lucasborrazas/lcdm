import {
  SIMULACION_VACIA,
  esSimulacionVacia,
  leerSimulacion,
  precioEsperado,
  simularTorneo,
  type Simulacion,
} from "../simulacionTorneo";

const precios = { precioEfectivo: 18000, precioTransferencia: 22000 };

const real = {
  precios,
  horarios: [
    { id: "h1", hora: "10:00", nombre: "Sala de 3 a 5", orden: 0, cupoMaximo: 4 },
    { id: "h2", hora: "11:00", nombre: "1° a 7° grado", orden: 1, cupoMaximo: null },
  ],
  inscripciones: [
    { horarioId: "h1", pago: true, monto: 18000, metodoPago: "EFECTIVO" as const },
    { horarioId: "h1", pago: false, monto: null },
    { horarioId: "h1", pago: false, monto: null },
    { horarioId: "h2", pago: true, monto: 22000, metodoPago: "TRANSFERENCIA" as const },
  ],
  gastos: [{ monto: 10000 }],
};

const sim = (s: Partial<Simulacion>): Simulacion => ({ ...SIMULACION_VACIA, ...s });

describe("precioEsperado", () => {
  it("mezcla efectivo y transferencia segun el porcentaje", () => {
    expect(precioEsperado(precios, 0)).toBe(22000);
    expect(precioEsperado(precios, 100)).toBe(18000);
    expect(precioEsperado(precios, 25)).toBe(21000);
  });
});

describe("simularTorneo", () => {
  it("sin simulacion coincide con lo real", () => {
    const r = simularTorneo(real, SIMULACION_VACIA);
    expect(r.ingreso).toBe(40000);
    expect(r.ingresoReal).toBe(40000);
    expect(r.costos).toBe(10000);
    expect(r.ganancia).toBe(r.gananciaReal);
    expect(r.personasSimuladas).toBe(4);
  });

  it("si todos pagan, los pendientes suman al precio esperado", () => {
    const r = simularTorneo(real, sim({ todosPagan: true, pctEfectivo: 100 }));
    expect(r.ingreso).toBe(40000 + 2 * 18000);
    expect(r.filas[0].ingreso).toBe(18000 * 3);
  });

  it("la gente extra suma aunque no todos paguen, y marca el cupo excedido", () => {
    const r = simularTorneo(real, sim({ extras: { h1: 2 }, pctEfectivo: 0 }));
    expect(r.filas[0]).toMatchObject({ reales: 3, extra: 2, total: 5, excedeCupo: true });
    expect(r.ingreso).toBe(40000 + 2 * 22000);
    expect(r.filas[1].excedeCupo).toBe(false);
  });

  it("horarios y costos simulados se agregan a lo real", () => {
    const r = simularTorneo(
      real,
      sim({
        pctEfectivo: 50,
        horarios: [{ id: "s1", hora: "12:00", etiqueta: "Nuevo", cupo: 3, personas: 4 }],
        costos: [{ id: "c1", concepto: "Arbitro", monto: 5000 }],
      })
    );
    const fila = r.filas[2];
    expect(fila).toMatchObject({ simulado: true, total: 4, ingreso: 4 * 20000, excedeCupo: true });
    expect(r.costos).toBe(15000);
    expect(r.ganancia).toBe(40000 + 80000 - 15000);
  });
});

describe("medios de pago", () => {
  it("separa los que ya pagaron de los esperados, repartidos segun el %", () => {
    const r = simularTorneo(real, sim({ todosPagan: true, pctEfectivo: 30, extras: { h2: 8 } }));
    expect(r.medios).toEqual({
      pagaronEfectivo: 1,
      pagaronTransferencia: 1,
      esperados: 10,
      esperadosEfectivo: 3,
      esperadosTransferencia: 7,
      pendientesSinContar: 0,
    });
  });
  it("sin 'todos pagan' los pendientes quedan afuera", () => {
    const r = simularTorneo(real, sim({ extras: { h1: 1 } }));
    expect(r.medios).toMatchObject({ esperados: 1, pendientesSinContar: 2 });
  });
});

describe("leerSimulacion / esSimulacionVacia", () => {
  it("datos invalidos arrancan una simulacion vacia", () => {
    expect(leerSimulacion("no json")).toEqual(SIMULACION_VACIA);
    expect(leerSimulacion(JSON.stringify({ todosPagan: "si" }))).toEqual(SIMULACION_VACIA);
    expect(leerSimulacion(null)).toEqual(SIMULACION_VACIA);
  });

  it("detecta cuando no hay nada simulado", () => {
    expect(esSimulacionVacia(SIMULACION_VACIA)).toBe(true);
    expect(esSimulacionVacia(sim({ extras: { h1: 0 } }))).toBe(true);
    expect(esSimulacionVacia(sim({ extras: { h1: 1 } }))).toBe(false);
  });
});
