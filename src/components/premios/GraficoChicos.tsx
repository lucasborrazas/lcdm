"use client";

import { Bar, BarChart, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";

export const COLOR_MASCULINO = "#3b82f6";
export const COLOR_FEMENINO = "#ec4899";

export type DatoTurno = { hora: string; masculino: number; femenino: number };

const sinCeros = (valor: unknown) => (valor === 0 ? "" : String(valor));

// Barras apiladas por turno: masculino abajo, femenino arriba, con la cantidad
// dentro de cada tramo y el total del turno arriba de la barra.
export function GraficoChicos({ datos }: { datos: DatoTurno[] }) {
  const conTotal = datos.map((d) => ({ ...d, total: d.masculino + d.femenino, cima: 0 }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={conTotal} margin={{ top: 24, right: 8, left: 8, bottom: 0 }}>
          <XAxis dataKey="hora" tick={{ fontSize: 13, fontWeight: 600 }} axisLine={false} tickLine={false} />
          <YAxis hide domain={[0, (max: number) => Math.max(max, 1)]} />
          <Bar dataKey="masculino" stackId="chicos" fill={COLOR_MASCULINO} isAnimationActive={false}>
            <LabelList
              dataKey="masculino"
              position="center"
              formatter={sinCeros}
              style={{ fill: "#fff", fontSize: 14, fontWeight: 700 }}
            />
          </Bar>
          <Bar dataKey="femenino" stackId="chicos" fill={COLOR_FEMENINO} isAnimationActive={false}>
            <LabelList
              dataKey="femenino"
              position="center"
              formatter={sinCeros}
              style={{ fill: "#fff", fontSize: 14, fontWeight: 700 }}
            />
          </Bar>
          {/* tramo de altura cero encima de la pila: solo sirve para mostrar el total */}
          <Bar dataKey="cima" stackId="chicos" fill="transparent" isAnimationActive={false}>
            <LabelList
              dataKey="total"
              position="top"
              formatter={sinCeros}
              style={{ fill: "currentColor", fontSize: 15, fontWeight: 800 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
