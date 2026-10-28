"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  calcularPrecioUnitario, calcularPrecioConDescuento, calcularCostoTotal,
  calcularPrecioTotal, calcularGanancia, formatearMoneda, compararTalles,
} from "@/lib/calculations";
import type { PedidoGrupo } from "@/generated/prisma/client";
import type { ProductoConStock } from "@/lib/types";
import { useModoCliente } from "@/components/layout/ModoClienteProvider";
import { useCierreProtegido, ProtegerCierre } from "@/components/shared/CierreProtegido";

type EstadoPedido = "POR_PEDIR" | "ENCARGADO" | "ENTREGADO";

// Suma un producto a un pedido ya creado. Fecha, cliente, medio y estado de
// pago salen del pedido; aca solo se elige el producto, cantidad y precio.
export function AgregarProductoDialog({
  grupo,
  onOpenChange,
  onSuccess,
}: {
  grupo: PedidoGrupo | null;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const open = grupo !== null;
  const { modoCliente } = useModoCliente();
  const [productos, setProductos] = useState<ProductoConStock[]>([]);
  const [nombre, setNombre] = useState("");
  const [genero, setGenero] = useState("");
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [precio, setPrecio] = useState("");
  const [descuento, setDescuento] = useState("0");
  const [estadoPedido, setEstadoPedido] = useState<EstadoPedido>("POR_PEDIR");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const proteccion = useCierreProtegido({ open, onOpenChange, dirty: !!nombre });

  useEffect(() => {
    if (open) fetch("/api/productos").then((r) => r.json()).then(setProductos);
  }, [open]);

  const activos = productos.filter((p) => !p.archivado);
  const nombres = Array.from(new Set(activos.map((p) => p.nombre))).sort();
  const generos = Array.from(new Set(activos.filter((p) => p.nombre === nombre).map((p) => p.genero))).sort();
  const talles = activos
    .filter((p) => p.nombre === nombre && p.genero === genero)
    .sort((a, b) => compararTalles(a.talle, b.talle));
  const producto = productos.find((p) => p.id === productoId);

  const precioBase = producto && grupo ? calcularPrecioUnitario(producto.precioVenta, grupo.metodoPago) : 0;
  const cant = parseInt(cantidad) || 0;
  const precioUnitario = parseInt(precio) || 0;
  const totalLinea = calcularPrecioTotal(cant, precioUnitario);
  const ganancia = calcularGanancia(totalLinea, calcularCostoTotal(cant, producto?.costoActual ?? 0));
  const totalPedido = (grupo?.precioTotal ?? 0) + totalLinea;

  const limpiar = () => {
    setNombre("");
    setGenero("");
    setProductoId("");
    setCantidad("1");
    setPrecio("");
    setDescuento("0");
    setEstadoPedido("POR_PEDIR");
    setError(null);
  };

  const elegirTalle = (id: string) => {
    setProductoId(id);
    const p = productos.find((x) => x.id === id);
    if (p && grupo) setPrecio(calcularPrecioUnitario(p.precioVenta, grupo.metodoPago).toString());
    setDescuento("0");
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grupo || !productoId || cant < 1) return;
    setGuardando(true);
    setError(null);
    const res = await fetch(`/api/pedidos-grupo/${grupo.id}/lineas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productoId, cantidad: cant, precioUnitario, estadoPedido }),
    });
    setGuardando(false);
    if (!res.ok) return setError("No se pudo agregar el producto");
    limpiar();
    onSuccess();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        proteccion.onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <ProtegerCierre proteccion={proteccion}>
          <DialogHeader>
            <DialogTitle>Agregar producto al pedido</DialogTitle>
          </DialogHeader>
          {grupo && (
            <p className="-mt-2 text-sm text-muted-foreground">
              {grupo.cliente} · {grupo.metodoPago === "EFECTIVO" ? "Efectivo" : "Transferencia"} · total actual{" "}
              {formatearMoneda(grupo.precioTotal)}
            </p>
          )}
          <form onSubmit={guardar} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Producto</Label>
                <Select
                  value={nombre}
                  onValueChange={(v) => {
                    setNombre(v ?? "");
                    setGenero("");
                    setProductoId("");
                  }}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Elegir..." /></SelectTrigger>
                  <SelectContent>
                    {nombres.map((n) => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Género</Label>
                <Select
                  value={genero}
                  disabled={!nombre}
                  onValueChange={(v) => {
                    setGenero(v ?? "");
                    setProductoId("");
                  }}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Elegir..." /></SelectTrigger>
                  <SelectContent>
                    {generos.map((g) => (
                      <SelectItem key={g} value={g}>{g === "MASCULINO" ? "Masculino" : "Femenino"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Talle</Label>
                <Select value={productoId} disabled={!genero} onValueChange={(v) => v && elegirTalle(v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Elegir..." /></SelectTrigger>
                  <SelectContent>
                    {talles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.talle} (stock: {p.stockActual})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Cantidad</Label>
                <Input type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Precio unit. ($)</Label>
                <Input type="number" min="0" value={precio} onChange={(e) => setPrecio(e.target.value)} disabled={!producto} />
                {producto && <p className="text-[11px] text-muted-foreground">Calc: {formatearMoneda(precioBase)}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Descuento (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={descuento}
                  disabled={!producto}
                  onChange={(e) => {
                    setDescuento(e.target.value);
                    setPrecio(calcularPrecioConDescuento(precioBase, parseFloat(e.target.value) || 0).toString());
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Estado de este producto</Label>
              <Select value={estadoPedido} onValueChange={(v) => v && setEstadoPedido(v as EstadoPedido)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="POR_PEDIR">Por pedir</SelectItem>
                  <SelectItem value="ENCARGADO">Encargado</SelectItem>
                  <SelectItem value="ENTREGADO">Entregado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />
            <div className="text-sm text-muted-foreground">
              Este producto: <strong className="text-foreground">{formatearMoneda(totalLinea)}</strong>
              {!modoCliente && producto && (
                <>
                  {" · "}Ganancia:{" "}
                  <span className={ganancia >= 0 ? "text-green-600" : "text-red-500"}>{formatearMoneda(ganancia)}</span>
                </>
              )}
              <br />
              Nuevo total del pedido: <strong className="text-foreground">{formatearMoneda(totalPedido)}</strong>
              {grupo && grupo.sena > 0 && <> · Saldo {formatearMoneda(totalPedido - grupo.sena)}</>}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => proteccion.onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!productoId || cant < 1 || guardando}>
                {guardando ? "Agregando..." : "Agregar producto"}
              </Button>
            </div>
          </form>
        </ProtegerCierre>
      </DialogContent>
    </Dialog>
  );
}
