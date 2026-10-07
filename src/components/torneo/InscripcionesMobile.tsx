"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Check, Plus, Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatearMoneda } from "@/lib/calculations";
import { EDADES_DISPONIBLES, colorHorario, montoPorMetodoPago } from "@/lib/torneo";
import {
  aplicarFiltroPago,
  contadoresPago,
  filtrarBase,
  kpisCobro,
  textoCupo,
  type FiltroPago,
} from "@/lib/inscripcionesMobile";
import type { HorarioConCupo, InscripcionConHorario, TorneoConResumen } from "@/lib/types";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { MobileHeader, TorneoPill } from "@/components/mobile/MobileHeader";
import { useToast } from "@/components/mobile/ToastUndo";
import { Chip, EtiquetaSeccion, Fab, Segmented, SwitchGrande } from "@/components/mobile/ui";
import { useReportarCambios } from "@/components/shared/CierreProtegido";

type Metodo = "EFECTIVO" | "TRANSFERENCIA";
type ValorPago = "NO_PAGO" | Metodo;
type CambiosPago = { pago: boolean; metodoPago: Metodo | null; monto: number | null };

const LS_ULTIMO_METODO = "lcdm-ultimo-metodo-pago";

const EQUIPOS: Record<string, { nombre: string; color: string }> = {
  ROJO: { nombre: "Rojo", color: "#dc2626" },
  AMARILLO: { nombre: "Amarillo", color: "#a16207" },
  NARANJA: { nombre: "Naranja", color: "#f97316" },
};

function leerUltimoMetodo(): Metodo {
  try {
    return localStorage.getItem(LS_ULTIMO_METODO) === "TRANSFERENCIA" ? "TRANSFERENCIA" : "EFECTIVO";
  } catch {
    return "EFECTIVO";
  }
}

async function putInscripcion(id: string, body: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch(`/api/torneo/inscripciones/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function PagoRadios({
  value,
  onChange,
  torneo,
}: {
  value: ValorPago;
  onChange: (v: ValorPago) => void;
  torneo: TorneoConResumen | null;
}) {
  const opciones: { value: ValorPago; label: string; sub?: string }[] = [
    { value: "NO_PAGO", label: "Sin pagar" },
    { value: "EFECTIVO", label: "Efectivo", sub: torneo ? formatearMoneda(torneo.precioEfectivo) : undefined },
    { value: "TRANSFERENCIA", label: "Transferencia", sub: torneo ? formatearMoneda(torneo.precioTransferencia) : undefined },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {opciones.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "flex min-h-14 flex-col items-center justify-center rounded-xl border px-1 text-center text-[13px] font-semibold",
            value === o.value ? "border-primary bg-[hsl(209_65%_95%)] ring-2 ring-primary" : "bg-background"
          )}
        >
          {o.label}
          {o.sub && <span className="text-[11px] font-medium text-muted-foreground">{o.sub}</span>}
        </button>
      ))}
    </div>
  );
}

function ChipsEdad({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Chip active={value == null} onClick={() => onChange(null)}>—</Chip>
      {EDADES_DISPONIBLES.map((e) => (
        <Chip key={e} active={value === e} onClick={() => onChange(e)}>{e}</Chip>
      ))}
    </div>
  );
}

function ChipsHorario({
  horarios,
  value,
  onChange,
}: {
  horarios: HorarioConCupo[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {horarios.filter((h) => h.activo).map((h) => (
        <Chip key={h.id} active={value === h.id} color={colorHorario(h.orden).hex} onClick={() => onChange(h.id)}>
          {h.hora} · {h.grupoEdad.nombre} ({textoCupo(h.inscriptos, h.cupoMaximo)})
        </Chip>
      ))}
    </div>
  );
}

const inputCls = "h-12 w-full rounded-xl bg-muted px-3 text-[15px] outline-none";

function HojaAlumno({
  open,
  onOpenChange,
  inscripcion,
  horarios,
  torneo,
  onGuardado,
  onEliminada,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  inscripcion: InscripcionConHorario | null;
  horarios: HorarioConCupo[];
  torneo: TorneoConResumen | null;
  onGuardado: () => Promise<void>;
  onEliminada: () => Promise<void>;
}) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Alumno">
      {inscripcion && (
        <FormAlumno
          inscripcion={inscripcion}
          horarios={horarios}
          torneo={torneo}
          onCerrar={() => onOpenChange(false)}
          onGuardado={onGuardado}
          onEliminada={onEliminada}
        />
      )}
    </BottomSheet>
  );
}

// Se monta al abrir la hoja, asi el borrador arranca desde la inscripcion.
function FormAlumno({
  inscripcion,
  horarios,
  torneo,
  onCerrar,
  onGuardado,
  onEliminada,
}: {
  inscripcion: InscripcionConHorario;
  horarios: HorarioConCupo[];
  torneo: TorneoConResumen | null;
  onCerrar: () => void;
  onGuardado: () => Promise<void>;
  onEliminada: () => Promise<void>;
}) {
  const toast = useToast();
  const [nombre, setNombre] = useState(inscripcion.nombre);
  const [edad, setEdad] = useState<string | null>(inscripcion.edad ?? null);
  const [horarioId, setHorarioId] = useState(inscripcion.horarioId);
  const [pago, setPago] = useState<ValorPago>(
    inscripcion.pago ? inscripcion.metodoPago ?? "NO_PAGO" : "NO_PAGO"
  );
  const [monto, setMonto] = useState(inscripcion.monto?.toString() ?? "");
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const pagoOriginal: ValorPago = inscripcion.pago ? inscripcion.metodoPago ?? "NO_PAGO" : "NO_PAGO";
  useReportarCambios(
    nombre !== inscripcion.nombre ||
      edad !== (inscripcion.edad ?? null) ||
      horarioId !== inscripcion.horarioId ||
      pago !== pagoOriginal ||
      (pago !== "NO_PAGO" && monto !== (inscripcion.monto?.toString() ?? ""))
  );

  const elegirPago = (v: ValorPago) => {
    setPago(v);
    const m = torneo ? montoPorMetodoPago(torneo, v === "NO_PAGO" ? null : v) : null;
    setMonto(m != null ? m.toString() : "");
  };

  const guardar = async () => {
    setGuardando(true);
    const cambioHorario = horarioId !== inscripcion.horarioId;
    const ok = await putInscripcion(inscripcion.id, {
      nombre: nombre.trim(),
      edad,
      // solo si cambia: el backend limpia el equipo cada vez que recibe horarioId
      ...(cambioHorario ? { horarioId } : {}),
      pago: pago !== "NO_PAGO",
      metodoPago: pago === "NO_PAGO" ? null : pago,
      monto: pago === "NO_PAGO" ? null : parseInt(monto) || 0,
    });
    setGuardando(false);
    if (!ok) return toast("No se pudo guardar");
    await onGuardado();
    onCerrar();
  };

  const eliminar = async () => {
    try {
      const res = await fetch(`/api/torneo/inscripciones/${inscripcion.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      return toast("No se pudo eliminar");
    }
    await onEliminada();
    onCerrar();
    toast(`${inscripcion.nombre} eliminado`);
  };

  return (
    <div className="space-y-4">
      <div>
        <EtiquetaSeccion>Nombre</EtiquetaSeccion>
        <input className={inputCls} value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </div>
      <div>
        <EtiquetaSeccion>Edad</EtiquetaSeccion>
        <ChipsEdad value={edad} onChange={setEdad} />
      </div>
      <div>
        <EtiquetaSeccion>Pago</EtiquetaSeccion>
        <PagoRadios value={pago} onChange={elegirPago} torneo={torneo} />
        {pago !== "NO_PAGO" && (
          <div className="mt-3">
            <EtiquetaSeccion>Monto abonado ($)</EtiquetaSeccion>
            <input className={inputCls} type="number" inputMode="numeric" value={monto} onChange={(e) => setMonto(e.target.value)} />
          </div>
        )}
      </div>
      <div>
        <EtiquetaSeccion>Horario</EtiquetaSeccion>
        <ChipsHorario horarios={horarios} value={horarioId} onChange={setHorarioId} />
        {horarioId !== inscripcion.horarioId && inscripcion.equipo && (
          <p className="mt-2 text-xs text-[hsl(25_75%_32%)]">Cambiar de horario quita el equipo asignado.</p>
        )}
      </div>
      <div className="flex gap-2 pt-1">
        {confirmarBorrado ? (
          <button type="button" onClick={eliminar} className="h-12 flex-1 rounded-xl bg-[hsl(0_70%_48%)] text-[15px] font-semibold text-white">
            Confirmar eliminar
          </button>
        ) : (
          <button type="button" onClick={() => setConfirmarBorrado(true)} className="h-12 flex-1 rounded-xl border border-[hsl(0_70%_48%)] text-[15px] font-semibold text-[hsl(0_70%_48%)]">
            Eliminar
          </button>
        )}
        <button
          type="button"
          onClick={guardar}
          disabled={!nombre.trim() || guardando}
          className="h-12 flex-1 rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground disabled:opacity-50"
        >
          Listo
        </button>
      </div>
    </div>
  );
}

function HojaNueva({
  open,
  onOpenChange,
  horarios,
  torneo,
  onCreada,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  horarios: HorarioConCupo[];
  torneo: TorneoConResumen | null;
  onCreada: () => Promise<void>;
}) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Nueva inscripción">
      <FormNueva
        horarios={horarios}
        torneo={torneo}
        onCerrar={() => onOpenChange(false)}
        onCreada={onCreada}
      />
    </BottomSheet>
  );
}

function FormNueva({
  horarios,
  torneo,
  onCerrar,
  onCreada,
}: {
  horarios: HorarioConCupo[];
  torneo: TorneoConResumen | null;
  onCerrar: () => void;
  onCreada: () => Promise<void>;
}) {
  const toast = useToast();
  const [nombre, setNombre] = useState("");
  const [edad, setEdad] = useState<string | null>(null);
  const [horarioId, setHorarioId] = useState("");
  const [pago, setPago] = useState<ValorPago>("NO_PAGO");
  const [guardando, setGuardando] = useState(false);

  useReportarCambios(!!nombre.trim() || edad !== null || horarioId !== "" || pago !== "NO_PAGO");

  const guardar = async () => {
    setGuardando(true);
    const monto = torneo ? montoPorMetodoPago(torneo, pago === "NO_PAGO" ? null : pago) : null;
    try {
      const res = await fetch("/api/torneo/inscripciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          edad,
          horarioId,
          pago: pago !== "NO_PAGO",
          metodoPago: pago === "NO_PAGO" ? null : pago,
          monto: pago === "NO_PAGO" ? null : monto ?? 0,
        }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setGuardando(false);
      return toast("No se pudo inscribir");
    }
    setGuardando(false);
    await onCreada();
    onCerrar();
    toast(`${nombre.trim()} inscripto`);
  };

  return (
    <div className="space-y-4">
      <div>
        <EtiquetaSeccion>Nombre</EtiquetaSeccion>
        <input className={inputCls} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del alumno" />
      </div>
      <div>
        <EtiquetaSeccion>Edad</EtiquetaSeccion>
        <ChipsEdad value={edad} onChange={setEdad} />
      </div>
      <div>
        <EtiquetaSeccion>Horario</EtiquetaSeccion>
        <ChipsHorario horarios={horarios} value={horarioId} onChange={setHorarioId} />
      </div>
      <div>
        <EtiquetaSeccion>Pago</EtiquetaSeccion>
        <PagoRadios value={pago} onChange={setPago} torneo={torneo} />
      </div>
      <button
        type="button"
        onClick={guardar}
        disabled={!nombre.trim() || !horarioId || guardando}
        className="h-12 w-full rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground disabled:opacity-50"
      >
        Inscribir
      </button>
    </div>
  );
}

export function InscripcionesMobile({
  torneos,
  torneoId,
  torneoActual,
  seleccionarTorneo,
  inscripciones,
  setInscripciones,
  horarios,
  loading,
  cargar,
  recargarTorneos,
  onGestionar,
}: {
  torneos: TorneoConResumen[];
  torneoId: string | undefined;
  torneoActual: TorneoConResumen | null;
  seleccionarTorneo: (id: string) => void;
  inscripciones: InscripcionConHorario[];
  setInscripciones: Dispatch<SetStateAction<InscripcionConHorario[]>>;
  horarios: HorarioConCupo[];
  loading: boolean;
  cargar: () => Promise<void>;
  recargarTorneos: () => Promise<unknown>;
  onGestionar: () => void;
}) {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [filtroPago, setFiltroPago] = useState<FiltroPago>("todos");
  const [filtroHorario, setFiltroHorario] = useState("all");
  const [alumnoId, setAlumnoId] = useState<string | null>(null);
  const [alumnoAbierto, setAlumnoAbierto] = useState(false);
  const [nuevaAbierta, setNuevaAbierta] = useState(false);

  const base = useMemo(
    () => filtrarBase(inscripciones, { q, horarioId: filtroHorario }),
    [inscripciones, q, filtroHorario]
  );
  const visibles = useMemo(() => aplicarFiltroPago(base, filtroPago), [base, filtroPago]);
  const contadores = contadoresPago(base);
  const kpis = kpisCobro(inscripciones, torneoActual?.precioEfectivo ?? 0);
  const alumno = inscripciones.find((i) => i.id === alumnoId) ?? null;

  const aplicarPago = (id: string, c: CambiosPago) =>
    setInscripciones((prev) => prev.map((x) => (x.id === id ? { ...x, ...c } : x)));

  const cambiarPago = async (i: InscripcionConHorario, metodo: Metodo | null) => {
    const anterior: CambiosPago = { pago: i.pago, metodoPago: i.metodoPago, monto: i.monto };
    const nuevo: CambiosPago = metodo
      ? { pago: true, metodoPago: metodo, monto: torneoActual ? montoPorMetodoPago(torneoActual, metodo) : null }
      : { pago: false, metodoPago: null, monto: null };

    aplicarPago(i.id, nuevo);
    if (!(await putInscripcion(i.id, nuevo))) {
      aplicarPago(i.id, anterior);
      return toast("No se pudo guardar el pago");
    }
    if (metodo) {
      try { localStorage.setItem(LS_ULTIMO_METODO, metodo); } catch {}
    }
    recargarTorneos();

    toast(
      metodo ? `${i.nombre} · pagó (${metodo === "EFECTIVO" ? "efectivo" : "transferencia"})` : `${i.nombre} · sin pagar`,
      async () => {
        aplicarPago(i.id, anterior);
        if (!(await putInscripcion(i.id, anterior))) toast("No se pudo deshacer");
        recargarTorneos();
      }
    );
  };

  const refrescar = async () => {
    await cargar();
    await recargarTorneos();
  };

  return (
    <div>
      <MobileHeader
        seccion="tor"
        title="Inscripciones"
        pill={<TorneoPill torneos={torneos} torneoId={torneoId} onSelect={seleccionarTorneo} />}
      />

      <div className="sticky top-0 z-10 -mx-4 border-b bg-background px-4 pb-2.5 pt-1">
        <div className="mb-2 flex gap-2">
          <div className="flex-1 rounded-xl bg-[hsl(150_50%_94%)] px-3 py-[7px]">
            <div className="text-[11px] font-medium text-[hsl(152_45%_28%)]">Cobrado · {kpis.nPagaron} de {kpis.nTotal}</div>
            <div className="text-[18px] font-bold text-[hsl(152_55%_24%)]">{formatearMoneda(kpis.cobrado)}</div>
          </div>
          <div className="flex-1 rounded-xl bg-[hsl(30_90%_94%)] px-3 py-[7px]">
            <div className="text-[11px] font-medium text-[hsl(25_70%_32%)]">Falta cobrar · {kpis.nSin}</div>
            <div className="text-[18px] font-bold text-[hsl(25_75%_28%)]">{formatearMoneda(kpis.pendiente)}</div>
          </div>
        </div>

        <div className="mb-2 flex gap-2">
          <div className="flex h-11 flex-1 items-center gap-2 rounded-xl bg-muted px-3">
            <Search className="h-[18px] w-[18px] text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar alumno..."
              className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
            />
          </div>
          <button
            type="button"
            onClick={onGestionar}
            disabled={!torneoId}
            aria-label="Gestionar torneo"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted disabled:opacity-50"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </div>

        <Segmented<FiltroPago>
          value={filtroPago}
          onChange={setFiltroPago}
          options={[
            { value: "todos", label: "Todos", count: contadores.todos },
            { value: "sin", label: "Sin pagar", count: contadores.sin },
            { value: "pagaron", label: "Pagaron", count: contadores.pagaron },
          ]}
        />

        <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none]">
          <Chip active={filtroHorario === "all"} onClick={() => setFiltroHorario("all")}>Todos los horarios</Chip>
          {horarios.filter((h) => h.activo).map((h) => (
            <Chip
              key={h.id}
              active={filtroHorario === h.id}
              color={colorHorario(h.orden).hex}
              onClick={() => setFiltroHorario(h.id)}
            >
              {h.hora} · {h.grupoEdad.nombre} · {textoCupo(h.inscriptos, h.cupoMaximo)}
            </Chip>
          ))}
        </div>
      </div>

      <div className="divide-y">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Cargando...</p>
        ) : visibles.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Sin inscripciones</p>
        ) : (
          visibles.map((i) => {
            const equipo = i.equipo ? EQUIPOS[i.equipo] : null;
            return (
              <div key={i.id} className="flex items-center gap-3 py-2.5">
                <button
                  type="button"
                  onClick={() => { setAlumnoId(i.id); setAlumnoAbierto(true); }}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-bold",
                      i.pago ? "bg-[hsl(150_50%_90%)] text-[hsl(152_55%_26%)]" : "bg-[hsl(210_30%_94%)] text-[hsl(226_40%_35%)]"
                    )}
                  >
                    {i.pago ? <Check className="h-5 w-5" /> : i.nombre[0]?.toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold">{i.nombre}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {i.edad ? `${i.edad} · ` : ""}
                      {i.horario.hora} {i.horario.grupoEdad.nombre}
                      {equipo && (
                        <span className="font-semibold" style={{ color: equipo.color }}> · {equipo.nombre}</span>
                      )}
                    </span>
                    <span
                      className={cn(
                        "mt-1.5 inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold",
                        i.pago
                          ? "bg-[hsl(150_50%_92%)] text-[hsl(152_55%_24%)]"
                          : "border border-[hsl(30_80%_78%)] bg-background text-[hsl(25_75%_32%)]"
                      )}
                    >
                      {i.pago
                        ? `${i.metodoPago === "TRANSFERENCIA" ? "Transf." : "Efectivo"} · ${formatearMoneda(i.monto ?? 0)}`
                        : "Sin pagar"}
                    </span>
                  </span>
                </button>
                <SwitchGrande
                  checked={i.pago}
                  label={`Pago de ${i.nombre}`}
                  onChange={() => cambiarPago(i, i.pago ? null : leerUltimoMetodo())}
                />
              </div>
            );
          })
        )}
      </div>

      <Fab onClick={() => setNuevaAbierta(true)} disabled={!torneoId}>
        <Plus className="h-5 w-5" />
        Inscribir
      </Fab>

      <HojaAlumno
        open={alumnoAbierto}
        onOpenChange={setAlumnoAbierto}
        inscripcion={alumno}
        horarios={horarios}
        torneo={torneoActual}
        onGuardado={refrescar}
        onEliminada={refrescar}
      />
      <HojaNueva
        open={nuevaAbierta}
        onOpenChange={setNuevaAbierta}
        horarios={horarios}
        torneo={torneoActual}
        onCreada={refrescar}
      />
    </div>
  );
}
