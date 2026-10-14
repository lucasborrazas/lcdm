import {
  normalizarConfig,
  redireccionSeccionApagada,
  seccionDeRuta,
  seccionesActivas,
} from "../secciones";

const todas = { ind: true, tor: true, pre: true };

describe("seccionDeRuta", () => {
  it("reconoce las rutas de cada seccion", () => {
    expect(seccionDeRuta("/")).toBe("ind");
    expect(seccionDeRuta("/pedidos")).toBe("ind");
    expect(seccionDeRuta("/stock/abc")).toBe("ind");
    expect(seccionDeRuta("/torneo/equipos")).toBe("tor");
    expect(seccionDeRuta("/premios/resumen")).toBe("pre");
  });
  it("devuelve null para rutas fuera de las secciones", () => {
    expect(seccionDeRuta("/configuracion")).toBeNull();
    expect(seccionDeRuta("/mas")).toBeNull();
  });
  it("no confunde prefijos parecidos", () => {
    expect(seccionDeRuta("/torneos")).toBeNull();
    expect(seccionDeRuta("/premiosx")).toBeNull();
  });
});

describe("seccionesActivas", () => {
  it("lista solo las activas, en orden", () => {
    expect(seccionesActivas(todas)).toEqual(["ind", "tor", "pre"]);
    expect(seccionesActivas({ ind: false, tor: true, pre: false })).toEqual(["tor"]);
  });
});

describe("redireccionSeccionApagada", () => {
  it("redirige al inicio de la primera activa si la seccion esta apagada", () => {
    expect(redireccionSeccionApagada("/torneo/resumen", { ...todas, tor: false })).toBe("/pedidos");
    expect(redireccionSeccionApagada("/pedidos", { ...todas, ind: false })).toBe("/torneo/inscripciones");
    expect(redireccionSeccionApagada("/premios/gastos", { ...todas, pre: false })).toBe("/pedidos");
  });
  it("no redirige si la seccion esta activa o la ruta es neutral", () => {
    expect(redireccionSeccionApagada("/pedidos", { ...todas, tor: false })).toBeNull();
    expect(redireccionSeccionApagada("/configuracion", { ind: false, tor: true, pre: false })).toBeNull();
  });
});

describe("normalizarConfig", () => {
  it("deja una seccion activa si vienen todas apagadas", () => {
    expect(normalizarConfig({ ind: false, tor: false, pre: false })).toEqual({ ind: true, tor: false, pre: false });
  });
  it("no toca una config valida", () => {
    expect(normalizarConfig({ ind: false, tor: true, pre: true })).toEqual({ ind: false, tor: true, pre: true });
  });
});
