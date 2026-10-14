"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModalResponsivo } from "@/components/shared/ModalResponsivo";
import { useReportarCambios } from "@/components/shared/CierreProtegido";
import { Chip, EtiquetaSeccion, Segmented } from "@/components/mobile/ui";
import { formatearMoneda } from "@/lib/calculations";
import { montoBono, sugerirFamilias, type Genero, type MetodoPago } from "@/lib/premios";
import type { EntregaConResumen, FamiliaConChicos, TurnoConConteo } from "@/lib/types";
import { btnPeligro, btnPrimario, campo } from "./estilos";

type ChicoForm = { clave: string; nombre: string; genero: Genero | null };
type Pago = "NO_PAGO" | MetodoPago;

type Estado = {
  turnoId: string;
  nombre: string;
  telefono: string;
  chicos: ChicoForm[];
  personas: string;
  pago: Pago;
  monto: string;
  montoEditado: boolean;
};

let contador = 0;
const nuevaClave = () => `c${++contador}`;

function estadoInicial(
  familia: FamiliaConChicos | null,
  entrega: EntregaConResumen,
  turnoInicialId: string
): Estado {
  if (!familia) {
    return {
      turnoId: turnoInicialId,
      nombre: "",
      telefono: "",
      chicos: [{ clave: nuevaClave(), nombre: "", genero: null }],
      personas: "",
      pago: "NO_PAGO",
      monto: montoBono(entrega, null).toString(),
      montoEditado: false,
    };
  }
  return {
    turnoId: familia.turnoId,
    nombre: familia.nombre,
    telefono: familia.telefono ?? "",
    chicos: familia.chicos.map((c) => ({ clave: c.id, nombre: c.nombre, genero: c.genero })),
    personas: familia.totalPersonas.toString(),
    pago: familia.metodoPago ?? "NO_PAGO",
    monto: familia.monto.toString(),
    // un monto distinto al de lista es una excepcion: no se recalcula solo
    montoEditado: familia.monto !== montoBono(entrega, familia.metodoPago),
  };
}

// Lo que cuenta para el aviso de "cambios sin guardar" (sin las claves internas).
const huella = (e: Estado) =>
  JSON.stringify({ ...e, chicos: e.chicos.map((c) => [c.nombre, c.genero]) });

function BotonGenero({ genero, activo, onClick }: { genero: Genero; activo: boolean; onClick: () => void }) {
  const esM = genero === "MASCULINO";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={cn(
        "h-12 w-12 shrink-0 rounded-xl border text-[15px] font-bold transition-colors",
        activo
          ? esM
            ? "border-blue-500 bg-blue-500 text-white"
            : "border-pink-500 bg-pink-500 text-white"
          : "border-border bg-background text-muted-foreground"
      )}
    >
      {esM ? "M" : "F"}
    </button>
  );
}

function FormFamilia({
  familia,
  entrega,
  turnos,
  familias,
  turnoInicialId,
  onCerrar,
  onGuardada,
  onEliminar,
  onElegirExistente,
}: {
  familia: FamiliaConChicos | null;
  entrega: EntregaConResumen;
  turnos: TurnoConConteo[];
  familias: FamiliaConChicos[];
  turnoInicialId: string;
  onCerrar: () => void;
  onGuardada: () => void;
  onEliminar: (f: FamiliaConChicos) => void;
  onElegirExistente: (f: FamiliaConChicos) => void;
}) {
  const [inicial] = useState(() => estadoInicial(familia, entrega, turnoInicialId));
  const [e, setE] = useState<Estado>(inicial);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);

  useReportarCambios(huella(e) !== huella(inicial));

  const cambiar = (parcial: Partial<Estado>) => setE((prev) => ({ ...prev, ...parcial }));

  const cambiarPago = (pago: Pago) => {
    // el monto sigue al medio de pago mientras nadie lo haya tocado a mano
    cambiar({
      pago,
      ...(e.montoEditado ? {} : { monto: montoBono(entrega, pago === "NO_PAGO" ? null : pago).toString() }),
    });
  };

  const cambiarChico = (clave: string, parcial: Partial<ChicoForm>) =>
    cambiar({ chicos: e.chicos.map((c) => (c.clave === clave ? { ...c, ...parcial } : c)) });

  const turnosElegibles = turnos.filter((t) => t.activo || t.id === familia?.turnoId);
  const sugeridas = useMemo(
    () => (familia ? [] : sugerirFamilias(familias, e.nombre)),
    [familia, familias, e.nombre]
  );
  const guardar = async () => {
    const personas = parseInt(e.personas);
    if (!e.turnoId) return setError("Elegí el turno.");
    if (!e.nombre.trim()) return setError("Escribí el nombre de la familia.");
    if (e.chicos.some((c) => !c.nombre.trim())) return setError("Completá el nombre de cada alumno.");
    if (e.chicos.some((c) => !c.genero)) return setError("Elegí el género (M o F) de cada alumno.");
    if (isNaN(personas) || personas < 0) return setError("Indicá el total de personas que vienen (con los alumnos).");
    if (e.monto === "" || isNaN(parseInt(e.monto))) return setError("Indicá el monto del bono.");

    setGuardando(true);
    setError(null);
    try {
      const res = await fetch(familia ? `/api/premios/familias/${familia.id}` : "/api/premios/familias", {
        method: familia ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turnoId: e.turnoId,
          nombre: e.nombre.trim(),
          telefono: e.telefono.trim() || null,
          totalPersonas: personas,
          metodoPago: e.pago === "NO_PAGO" ? null : e.pago,
          monto: parseInt(e.monto),
          chicos: e.chicos.map((c) => ({ nombre: c.nombre.trim(), genero: c.genero })),
        }),
      });
      if (!res.ok) throw new Error();
      onGuardada();
      onCerrar();
    } catch {
      setError("No se pudo guardar. Probá de nuevo.");
    }
    setGuardando(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <EtiquetaSeccion>Turno</EtiquetaSeccion>
        <div className="flex flex-wrap gap-2">
          {turnosElegibles.map((t) => (
            <Chip key={t.id} active={e.turnoId === t.id} onClick={() => cambiar({ turnoId: t.id })}>
              {t.hora}
              {t.grupoEdad ? ` · ${t.grupoEdad.nombre}` : ""}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <EtiquetaSeccion>Familia</EtiquetaSeccion>
        <input
          className={campo}
          placeholder="Apellido o nombre de referencia"
          value={e.nombre}
          onChange={(ev) => cambiar({ nombre: ev.target.value })}
        />
        {sugeridas.length > 0 && (
          <div className="mt-2 rounded-xl border border-dashed p-2.5">
            <p className="mb-1.5 text-xs text-muted-foreground">
              ¿Ya está cargada? Agregá el alumno ahí para no cobrar otro bono:
            </p>
            <div className="space-y-1.5">
              {sugeridas.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onElegirExistente(f)}
                  className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg bg-muted px-3 text-left text-sm"
                >
                  <span className="font-semibold">{f.nombre}</span>
                  <span className="text-xs text-muted-foreground">
                    {f.turno.hora} · {f.chicos.map((c) => c.nombre).join(", ")}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <EtiquetaSeccion>Teléfono (opcional)</EtiquetaSeccion>
        <input
          className={campo}
          type="tel"
          inputMode="tel"
          value={e.telefono}
          onChange={(ev) => cambiar({ telefono: ev.target.value })}
        />
      </div>

      <div>
        <EtiquetaSeccion>Alumnos que reciben premio</EtiquetaSeccion>
        <div className="space-y-2">
          {e.chicos.map((c, i) => (
            <div key={c.clave} className="flex items-center gap-2">
              <input
                className={campo}
                placeholder={`Alumno ${i + 1}`}
                value={c.nombre}
                onChange={(ev) => cambiarChico(c.clave, { nombre: ev.target.value })}
              />
              <BotonGenero genero="MASCULINO" activo={c.genero === "MASCULINO"} onClick={() => cambiarChico(c.clave, { genero: "MASCULINO" })} />
              <BotonGenero genero="FEMENINO" activo={c.genero === "FEMENINO"} onClick={() => cambiarChico(c.clave, { genero: "FEMENINO" })} />
              {e.chicos.length > 1 && (
                <button
                  type="button"
                  aria-label={`Quitar alumno ${i + 1}`}
                  onClick={() => cambiar({ chicos: e.chicos.filter((x) => x.clave !== c.clave) })}
                  className="flex h-12 w-9 shrink-0 items-center justify-center text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => cambiar({ chicos: [...e.chicos, { clave: nuevaClave(), nombre: "", genero: null }] })}
          className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed text-[15px] font-semibold text-muted-foreground"
        >
          <Plus className="h-4 w-4" />
          Agregar alumno (hermano)
        </button>
      </div>

      <div>
        <EtiquetaSeccion>Total de personas (con los alumnos)</EtiquetaSeccion>
        <input
          className={campo}
          type="number"
          inputMode="numeric"
          min="0"
          value={e.personas}
          onChange={(ev) => cambiar({ personas: ev.target.value })}
        />
      </div>

      <div>
        <EtiquetaSeccion>Pago del bono (uno por familia)</EtiquetaSeccion>
        <Segmented<Pago>
          value={e.pago}
          onChange={cambiarPago}
          options={[
            { value: "NO_PAGO", label: "Sin pagar" },
            { value: "EFECTIVO", label: "Efectivo" },
            { value: "TRANSFERENCIA", label: "Transf." },
          ]}
        />
      </div>

      <div>
        <EtiquetaSeccion>Monto del bono ($)</EtiquetaSeccion>
        <input
          className={campo}
          type="number"
          inputMode="numeric"
          min="0"
          value={e.monto}
          onChange={(ev) => cambiar({ monto: ev.target.value, montoEditado: true })}
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Lista: {formatearMoneda(entrega.precioTransferencia)} transferencia · {formatearMoneda(entrega.precioEfectivo)} efectivo.
          Podés cambiarlo si hay una excepción.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button type="button" onClick={guardar} disabled={guardando} className={btnPrimario}>
        {guardando ? "Guardando..." : familia ? "Guardar" : "Inscribir"}
      </button>

      {familia &&
        (confirmandoBorrado ? (
          <button
            type="button"
            onClick={() => {
              onEliminar(familia);
              onCerrar();
            }}
            className={cn(btnPeligro, "bg-destructive text-white")}
          >
            Sí, eliminar la familia
          </button>
        ) : (
          <button type="button" onClick={() => setConfirmandoBorrado(true)} className={btnPeligro}>
            Eliminar familia
          </button>
        ))}
    </div>
  );
}

export function FamiliaModal({
  open,
  onOpenChange,
  entrega,
  turnos,
  familias,
  familia,
  turnoInicialId,
  onGuardada,
  onEliminar,
  onElegirExistente,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entrega: EntregaConResumen | null;
  turnos: TurnoConConteo[];
  familias: FamiliaConChicos[];
  familia: FamiliaConChicos | null;
  turnoInicialId: string | null;
  onGuardada: () => void;
  onEliminar: (f: FamiliaConChicos) => void;
  onElegirExistente: (f: FamiliaConChicos) => void;
}) {
  const primerTurno = turnos.find((t) => t.activo)?.id ?? "";
  return (
    <ModalResponsivo
      open={open && !!entrega}
      onOpenChange={onOpenChange}
      title={familia ? `Familia ${familia.nombre}` : "Nueva inscripción"}
    >
      {entrega && (
        <FormFamilia
          key={familia?.id ?? "nueva"}
          familia={familia}
          entrega={entrega}
          turnos={turnos}
          familias={familias}
          turnoInicialId={turnoInicialId ?? primerTurno}
          onCerrar={() => onOpenChange(false)}
          onGuardada={onGuardada}
          onEliminar={onEliminar}
          onElegirExistente={onElegirExistente}
        />
      )}
    </ModalResponsivo>
  );
}
