import { agruparPorEquipo, nombreCorto, ordenarPorAsignacion } from "../equiposMobile";

const al = (nombre: string, equipo: "ROJO" | "AMARILLO" | "NARANJA" | null, at: string | null) => ({
  nombre,
  equipo,
  equipoAsignadoAt: at,
});

describe("ordenarPorAsignacion", () => {
  it("ordena por orden de llegada al equipo", () => {
    const r = ordenarPorAsignacion([
      al("C", "ROJO", "2026-10-03T10:00:00Z"),
      al("A", "ROJO", "2026-10-01T10:00:00Z"),
      al("B", "ROJO", "2026-10-02T10:00:00Z"),
    ]);
    expect(r.map((i) => i.nombre)).toEqual(["A", "B", "C"]);
  });
  it("no modifica la lista original", () => {
    const lista = [al("B", "ROJO", "2026-10-02T10:00:00Z"), al("A", "ROJO", "2026-10-01T10:00:00Z")];
    ordenarPorAsignacion(lista);
    expect(lista[0].nombre).toBe("B");
  });
});

describe("agruparPorEquipo", () => {
  it("separa sin asignar y cada equipo, ordenados", () => {
    const g = agruparPorEquipo([
      al("Sin", null, null),
      al("R2", "ROJO", "2026-10-02T10:00:00Z"),
      al("R1", "ROJO", "2026-10-01T10:00:00Z"),
      al("N1", "NARANJA", "2026-10-01T10:00:00Z"),
    ]);
    expect(g.SIN.map((i) => i.nombre)).toEqual(["Sin"]);
    expect(g.ROJO.map((i) => i.nombre)).toEqual(["R1", "R2"]);
    expect(g.AMARILLO).toEqual([]);
    expect(g.NARANJA).toHaveLength(1);
  });
});

describe("nombreCorto", () => {
  it("abrevia el apellido", () => {
    expect(nombreCorto("Lola Díaz")).toBe("Lola D.");
  });
  it("un solo nombre queda igual", () => {
    expect(nombreCorto("Lola")).toBe("Lola");
  });
  it("ignora espacios sobrantes", () => {
    expect(nombreCorto("  ana   ríos ")).toBe("ana R.");
  });
});
