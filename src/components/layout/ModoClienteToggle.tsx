"use client";

import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useModoCliente } from "./ModoClienteProvider";

export function ModoClienteToggle() {
  const { modoCliente, toggle } = useModoCliente();
  const Icon = modoCliente ? EyeOff : Eye;

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        modoCliente
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {modoCliente ? "Modo cliente: ON" : "Modo cliente"}
    </button>
  );
}
