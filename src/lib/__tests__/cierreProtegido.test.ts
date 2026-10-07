import { debeConfirmarCierre, hayCambios } from "../cierreProtegido";

describe("hayCambios", () => {
  it("sin cambios", () => {
    expect(hayCambios(false, [])).toBe(false);
    expect(hayCambios(false, [false, false])).toBe(false);
  });
  it("cambios propios del modal", () => {
    expect(hayCambios(true, [])).toBe(true);
  });
  it("cambios reportados por una parte del modal", () => {
    expect(hayCambios(false, [false, true])).toBe(true);
  });
});

describe("debeConfirmarCierre", () => {
  it("pregunta al cerrar con cambios", () => {
    expect(debeConfirmarCierre(false, true)).toBe(true);
  });
  it("cierra directo si no hay cambios", () => {
    expect(debeConfirmarCierre(false, false)).toBe(false);
  });
  it("nunca pregunta al abrir", () => {
    expect(debeConfirmarCierre(true, true)).toBe(false);
  });
});
