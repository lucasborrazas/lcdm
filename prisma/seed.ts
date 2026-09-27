import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

type ProductoSeed = {
  temporada: "VERANO" | "INVIERNO";
  genero: "MASCULINO" | "FEMENINO";
  nombre: string;
  talle: string;
  costoActual: number | null;
  precioVenta: number;
};

const PRODUCTOS: ProductoSeed[] = [
  // ── Verano Masculino ──────────────────────────────────────────────────────
  { temporada: "VERANO", genero: "MASCULINO", nombre: "Medias", talle: "1", costoActual: 5667, precioVenta: 15000 },
  { temporada: "VERANO", genero: "MASCULINO", nombre: "Medias", talle: "2", costoActual: 5667, precioVenta: 15000 },
  { temporada: "VERANO", genero: "MASCULINO", nombre: "Canilleras", talle: "S", costoActual: 15, precioVenta: 18000 },
  { temporada: "VERANO", genero: "MASCULINO", nombre: "Canilleras", talle: "M", costoActual: 1010, precioVenta: 18000 },
  { temporada: "VERANO", genero: "MASCULINO", nombre: "Conjunto verano", talle: "4", costoActual: 1167, precioVenta: 45000 },
  { temporada: "VERANO", genero: "MASCULINO", nombre: "Conjunto verano", talle: "6", costoActual: 70, precioVenta: 45000 },
  { temporada: "VERANO", genero: "MASCULINO", nombre: "Conjunto verano", talle: "8", costoActual: 18500, precioVenta: 45000 },
  { temporada: "VERANO", genero: "MASCULINO", nombre: "Conjunto verano", talle: "10", costoActual: 18500, precioVenta: 45000 },
  { temporada: "VERANO", genero: "MASCULINO", nombre: "Conjunto verano", talle: "12", costoActual: 18500, precioVenta: 45000 },
  { temporada: "VERANO", genero: "MASCULINO", nombre: "Conjunto verano", talle: "XS", costoActual: 20000, precioVenta: 45000 },
  { temporada: "VERANO", genero: "MASCULINO", nombre: "Conjunto verano", talle: "S", costoActual: 20000, precioVenta: 45000 },
  { temporada: "VERANO", genero: "MASCULINO", nombre: "Conjunto verano", talle: "M", costoActual: 20000, precioVenta: 45000 },
  { temporada: "VERANO", genero: "MASCULINO", nombre: "Conjunto verano", talle: "L", costoActual: 20000, precioVenta: 45000 },
  { temporada: "VERANO", genero: "MASCULINO", nombre: "Conjunto verano", talle: "XL", costoActual: 20000, precioVenta: 45000 },

  // ── Invierno Masculino ────────────────────────────────────────────────────
  { temporada: "INVIERNO", genero: "MASCULINO", nombre: "Conjunto de Invierno", talle: "4", costoActual: 36000, precioVenta: 72000 },
  { temporada: "INVIERNO", genero: "MASCULINO", nombre: "Conjunto de Invierno", talle: "6", costoActual: 36000, precioVenta: 72000 },
  { temporada: "INVIERNO", genero: "MASCULINO", nombre: "Conjunto de Invierno", talle: "8", costoActual: 36000, precioVenta: 72000 },
  { temporada: "INVIERNO", genero: "MASCULINO", nombre: "Conjunto de Invierno", talle: "10", costoActual: 36000, precioVenta: 72000 },
  { temporada: "INVIERNO", genero: "MASCULINO", nombre: "Conjunto de Invierno", talle: "12", costoActual: 36000, precioVenta: 72000 },
  { temporada: "INVIERNO", genero: "MASCULINO", nombre: "Conjunto de Invierno", talle: "14", costoActual: 36000, precioVenta: 72000 },
  { temporada: "INVIERNO", genero: "MASCULINO", nombre: "Conjunto de Invierno", talle: "16", costoActual: 36000, precioVenta: 72000 },
  { temporada: "INVIERNO", genero: "MASCULINO", nombre: "Conjunto de Invierno", talle: "S", costoActual: 38000, precioVenta: 72000 },
  { temporada: "INVIERNO", genero: "MASCULINO", nombre: "Conjunto de Invierno", talle: "M", costoActual: 38000, precioVenta: 72000 },
  { temporada: "INVIERNO", genero: "MASCULINO", nombre: "Conjunto de Invierno", talle: "L", costoActual: 38000, precioVenta: 72000 },
  { temporada: "INVIERNO", genero: "MASCULINO", nombre: "Conjunto de Invierno", talle: "XL", costoActual: 38000, precioVenta: 72000 },

  { temporada: "INVIERNO", genero: "MASCULINO", nombre: "Campera Rompevientos", talle: "4", costoActual: 25000, precioVenta: 52000 },
  { temporada: "INVIERNO", genero: "MASCULINO", nombre: "Campera Rompevientos", talle: "6", costoActual: 25000, precioVenta: 52000 },
  { temporada: "INVIERNO", genero: "MASCULINO", nombre: "Campera Rompevientos", talle: "8", costoActual: 25000, precioVenta: 52000 },
  { temporada: "INVIERNO", genero: "MASCULINO", nombre: "Campera Rompevientos", talle: "10", costoActual: 25000, precioVenta: 52000 },
  { temporada: "INVIERNO", genero: "MASCULINO", nombre: "Campera Rompevientos", talle: "12", costoActual: 25000, precioVenta: 52000 },
  { temporada: "INVIERNO", genero: "MASCULINO", nombre: "Campera Rompevientos", talle: "14", costoActual: 25000, precioVenta: 52000 },
  { temporada: "INVIERNO", genero: "MASCULINO", nombre: "Campera Rompevientos", talle: "XS", costoActual: 27000, precioVenta: 52000 },
  { temporada: "INVIERNO", genero: "MASCULINO", nombre: "Campera Rompevientos", talle: "S", costoActual: 27000, precioVenta: 52000 },
  { temporada: "INVIERNO", genero: "MASCULINO", nombre: "Campera Rompevientos", talle: "M", costoActual: 27000, precioVenta: 52000 },
  { temporada: "INVIERNO", genero: "MASCULINO", nombre: "Campera Rompevientos", talle: "L", costoActual: 27000, precioVenta: 52000 },
  { temporada: "INVIERNO", genero: "MASCULINO", nombre: "Campera Rompevientos", talle: "XL", costoActual: 27000, precioVenta: 52000 },

  // ── Verano Femenino ───────────────────────────────────────────────────────
  { temporada: "VERANO", genero: "FEMENINO", nombre: "Medias", talle: "1", costoActual: 5667, precioVenta: 15000 },
  { temporada: "VERANO", genero: "FEMENINO", nombre: "Medias", talle: "2", costoActual: 5667, precioVenta: 15000 },
  { temporada: "VERANO", genero: "FEMENINO", nombre: "Canilleras", talle: "S", costoActual: 8000, precioVenta: 18000 },
  { temporada: "VERANO", genero: "FEMENINO", nombre: "Canilleras", talle: "M", costoActual: 8000, precioVenta: 18000 },
  { temporada: "VERANO", genero: "FEMENINO", nombre: "Conjunto verano", talle: "4", costoActual: 18500, precioVenta: 45000 },
  { temporada: "VERANO", genero: "FEMENINO", nombre: "Conjunto verano", talle: "6", costoActual: 18500, precioVenta: 45000 },
  { temporada: "VERANO", genero: "FEMENINO", nombre: "Conjunto verano", talle: "8", costoActual: 18500, precioVenta: 45000 },
  { temporada: "VERANO", genero: "FEMENINO", nombre: "Conjunto verano", talle: "10", costoActual: 18500, precioVenta: 45000 },
  { temporada: "VERANO", genero: "FEMENINO", nombre: "Conjunto verano", talle: "12", costoActual: 18500, precioVenta: 45000 },
  { temporada: "VERANO", genero: "FEMENINO", nombre: "Conjunto verano", talle: "XS", costoActual: 20000, precioVenta: 45000 },
  { temporada: "VERANO", genero: "FEMENINO", nombre: "Conjunto verano", talle: "S", costoActual: 20000, precioVenta: 45000 },
  { temporada: "VERANO", genero: "FEMENINO", nombre: "Conjunto verano", talle: "M", costoActual: 20000, precioVenta: 45000 },
  { temporada: "VERANO", genero: "FEMENINO", nombre: "Conjunto verano", talle: "L", costoActual: 20000, precioVenta: 45000 },
  { temporada: "VERANO", genero: "FEMENINO", nombre: "Conjunto verano", talle: "XL", costoActual: 20000, precioVenta: 45000 },

  // ── Invierno Femenino ─────────────────────────────────────────────────────
  { temporada: "INVIERNO", genero: "FEMENINO", nombre: "Conjunto de Invierno", talle: "4", costoActual: 36000, precioVenta: 72000 },
  { temporada: "INVIERNO", genero: "FEMENINO", nombre: "Conjunto de Invierno", talle: "6", costoActual: 36000, precioVenta: 72000 },
  { temporada: "INVIERNO", genero: "FEMENINO", nombre: "Conjunto de Invierno", talle: "8", costoActual: 36000, precioVenta: 72000 },
  { temporada: "INVIERNO", genero: "FEMENINO", nombre: "Conjunto de Invierno", talle: "10", costoActual: 36000, precioVenta: 72000 },
  { temporada: "INVIERNO", genero: "FEMENINO", nombre: "Conjunto de Invierno", talle: "12", costoActual: 36000, precioVenta: 72000 },
  { temporada: "INVIERNO", genero: "FEMENINO", nombre: "Conjunto de Invierno", talle: "14", costoActual: 36000, precioVenta: 72000 },
  { temporada: "INVIERNO", genero: "FEMENINO", nombre: "Conjunto de Invierno", talle: "16", costoActual: 36000, precioVenta: 72000 },
  { temporada: "INVIERNO", genero: "FEMENINO", nombre: "Conjunto de Invierno", talle: "S", costoActual: 38000, precioVenta: 72000 },
  { temporada: "INVIERNO", genero: "FEMENINO", nombre: "Conjunto de Invierno", talle: "M", costoActual: 38000, precioVenta: 72000 },
  { temporada: "INVIERNO", genero: "FEMENINO", nombre: "Conjunto de Invierno", talle: "L", costoActual: 38000, precioVenta: 72000 },
  { temporada: "INVIERNO", genero: "FEMENINO", nombre: "Conjunto de Invierno", talle: "XL", costoActual: 38000, precioVenta: 72000 },

  { temporada: "INVIERNO", genero: "FEMENINO", nombre: "Campera Rompevientos", talle: "4", costoActual: 25000, precioVenta: 52000 },
  { temporada: "INVIERNO", genero: "FEMENINO", nombre: "Campera Rompevientos", talle: "6", costoActual: 25000, precioVenta: 52000 },
  { temporada: "INVIERNO", genero: "FEMENINO", nombre: "Campera Rompevientos", talle: "8", costoActual: 25000, precioVenta: 52000 },
  { temporada: "INVIERNO", genero: "FEMENINO", nombre: "Campera Rompevientos", talle: "10", costoActual: 25000, precioVenta: 52000 },
  { temporada: "INVIERNO", genero: "FEMENINO", nombre: "Campera Rompevientos", talle: "12", costoActual: 25000, precioVenta: 52000 },
  { temporada: "INVIERNO", genero: "FEMENINO", nombre: "Campera Rompevientos", talle: "14", costoActual: 25000, precioVenta: 52000 },
  { temporada: "INVIERNO", genero: "FEMENINO", nombre: "Campera Rompevientos", talle: "XS", costoActual: 27000, precioVenta: 52000 },
  { temporada: "INVIERNO", genero: "FEMENINO", nombre: "Campera Rompevientos", talle: "S", costoActual: 27000, precioVenta: 52000 },
  { temporada: "INVIERNO", genero: "FEMENINO", nombre: "Campera Rompevientos", talle: "M", costoActual: 27000, precioVenta: 52000 },
  { temporada: "INVIERNO", genero: "FEMENINO", nombre: "Campera Rompevientos", talle: "L", costoActual: 27000, precioVenta: 52000 },
  { temporada: "INVIERNO", genero: "FEMENINO", nombre: "Campera Rompevientos", talle: "XL", costoActual: 27000, precioVenta: 52000 },

  // ── Accesorios ────────────────────────────────────────────────────────────
  { temporada: "VERANO", genero: "MASCULINO", nombre: "Gorras", talle: "Único", costoActual: null, precioVenta: 7000 },
];

async function main() {
  console.log("Seeding productos...");

  for (const p of PRODUCTOS) {
    await prisma.producto.upsert({
      where: {
        temporada_genero_nombre_talle: {
          temporada: p.temporada,
          genero: p.genero,
          nombre: p.nombre,
          talle: p.talle,
        },
      },
      update: {
        costoActual: p.costoActual,
        precioVenta: p.precioVenta,
      },
      create: {
        temporada: p.temporada,
        genero: p.genero,
        nombre: p.nombre,
        talle: p.talle,
        costoActual: p.costoActual,
        precioVenta: p.precioVenta,
        stock: {
          create: {
            stockInicial: 0,
            alertaMinimo: 0,
          },
        },
      },
    });
  }

  const total = await prisma.producto.count();
  console.log(`✓ ${total} productos en la base de datos.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
