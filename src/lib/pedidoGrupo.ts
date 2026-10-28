import type { Prisma } from "@/generated/prisma/client";

// El total y el saldo de un pedido con varios productos se guardan en el
// grupo: hay que recalcularlos cada vez que cambia o se borra una linea.
// Si el grupo se queda sin lineas, se borra.
export async function recalcularGrupo(tx: Prisma.TransactionClient, grupoId: string | null | undefined) {
  if (!grupoId) return;
  const grupo = await tx.pedidoGrupo.findUnique({
    where: { id: grupoId },
    include: { lineas: { select: { precioTotal: true } } },
  });
  if (!grupo) return;
  if (grupo.lineas.length === 0) {
    await tx.pedidoGrupo.delete({ where: { id: grupoId } });
    return;
  }
  const precioTotal = grupo.lineas.reduce((s, l) => s + l.precioTotal, 0);
  await tx.pedidoGrupo.update({
    where: { id: grupoId },
    data: { precioTotal, saldoRestante: precioTotal - grupo.sena },
  });
}
