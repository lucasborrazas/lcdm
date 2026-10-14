import { redirect } from "next/navigation";

// Los costos viven en el Resumen, como en Torneo.
export default function GastosPremiosPage() {
  redirect("/premios/resumen");
}
