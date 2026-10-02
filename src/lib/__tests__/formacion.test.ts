import { calcularFormacion } from "../formacion";

describe("calcularFormacion", () => {
  it("arma 1 arquero con un solo jugador", () => {
    const resultado = calcularFormacion(["a"]);
    expect(resultado).toEqual([
      { jugador: "a", numero: 1, linea: "ARQ", xPct: 50, yPct: 90 },
    ]);
  });

  it("arma 1-2-2-2 con 7 jugadores", () => {
    const jugadores = ["a", "b", "c", "d", "e", "f", "g"];
    const resultado = calcularFormacion(jugadores);
    const lineas = resultado.map((r) => r.linea);
    expect(lineas).toEqual(["ARQ", "DEF", "DEF", "MED", "MED", "DEL", "DEL"]);
  });

  it("centra a un único jugador dentro de su línea", () => {
    const resultado = calcularFormacion(["arq", "def1"]);
    expect(resultado[1].xPct).toBe(50);
  });

  it("reparte dos jugadores de la misma línea a los costados", () => {
    const resultado = calcularFormacion(["arq", "def1", "def2"]);
    const defensores = resultado.filter((r) => r.linea === "DEF");
    expect(defensores[0].xPct).toBeCloseTo(33.33);
    expect(defensores[1].xPct).toBeCloseTo(66.67);
  });

  it("escala hasta 1-4-4-2 con 11 jugadores", () => {
    const jugadores = Array.from({ length: 11 }, (_, i) => `j${i}`);
    const resultado = calcularFormacion(jugadores);
    const conteo = { ARQ: 0, DEF: 0, MED: 0, DEL: 0 };
    resultado.forEach((r) => conteo[r.linea]++);
    expect(conteo).toEqual({ ARQ: 1, DEF: 4, MED: 4, DEL: 2 });
  });

  it("sigue sumando delanteros más allá de 11 jugadores", () => {
    const jugadores = Array.from({ length: 13 }, (_, i) => `j${i}`);
    const resultado = calcularFormacion(jugadores);
    expect(resultado[11].linea).toBe("DEL");
    expect(resultado[12].linea).toBe("DEL");
  });

  it("asigna números secuenciales según el orden de entrada", () => {
    const resultado = calcularFormacion(["a", "b", "c"]);
    expect(resultado.map((r) => r.numero)).toEqual([1, 2, 3]);
  });
});
