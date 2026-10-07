// Logica pura del aviso "cerrar sin guardar": se pregunta solo cuando algo
// intenta cerrar el modal y hay cambios sin guardar.

export function hayCambios(dirty: boolean, fuentes: Iterable<boolean>): boolean {
  if (dirty) return true;
  for (const f of fuentes) if (f) return true;
  return false;
}

export function debeConfirmarCierre(nuevoOpen: boolean, conCambios: boolean): boolean {
  return !nuevoOpen && conCambios;
}
