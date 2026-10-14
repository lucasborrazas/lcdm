import {
  normalizarConfig,
  redireccionSeccionApagada,
  seccionDeRuta,
  seccionesActivas,
} from "../secciones";

describe("seccionDeRuta", () => {
  it("reconoce las rutas de cada seccion", () => {
    expect(seccionDeRuta("/")).toBe("ind");
    expect(seccionDeRuta("/pedidos")).toBe("ind");
    expect(seccionDeRuta("/stock/abc")).toBe("ind");
    expect(seccionDeRuta("/torneo/equipos")).toBe("tor");
  });
  it("devuelve null para rutas fuera de las secciones", () => {
    expect(seccionDeRuta("/configuracion")).toBeNull();
    expect(seccionDeRuta("/mas")).toBeNull();
  });
  it("no confunde prefijos parecidos", () => {
    expect(seccionDeRuta("/torneos")).toBeNull();
  });
});

describe("seccionesActivas", () => {
  it("lista solo las activas, en orden", () => {
    expect(seccionesActivas({ ind: true, tor: true })).toEqual(["ind", "tor"]);
    expect(seccionesActivas({ ind: false, tor: true })).toEqual(["tor"]);
  });
});

describe("redireccionSeccionApagada", () => {
  it("redirige al inicio de la primera activa si la seccion esta apagada", () => {
    expect(redireccionSeccionApagada("/torneo/resumen", { ind: true, tor: false })).toBe("/pedidos");
    expect(redireccionSeccionApagada("/pedidos", { ind: false, tor: true })).toBe("/torneo/inscripciones");
  });
  it("no redirige si la seccion esta activa o la ruta es neutral", () => {
    expect(redireccionSeccionApagada("/pedidos", { ind: true, tor: false })).toBeNull();
    expect(redireccionSeccionApagada("/configuracion", { ind: false, tor: true })).toBeNull();
  });
});

describe("normalizarConfig", () => {
  it("deja una seccion activa si vienen todas apagadas", () => {
    expect(normalizarConfig({ ind: false, tor: false })).toEqual({ ind: true, tor: false });
  });
  it("no toca una config valida", () => {
    expect(normalizarConfig({ ind: false, tor: true })).toEqual({ ind: false, tor: true });
  });
});
