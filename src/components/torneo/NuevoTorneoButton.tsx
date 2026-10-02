"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { NuevoTorneoDialog } from "./NuevoTorneoDialog";
import type { TorneoConResumen } from "@/lib/types";

export function NuevoTorneoButton({
  torneos,
  onCreated,
}: {
  torneos: TorneoConResumen[];
  onCreated: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1.5" />
        Nuevo torneo
      </Button>
      <NuevoTorneoDialog open={open} onOpenChange={setOpen} torneos={torneos} onCreated={onCreated} />
    </>
  );
}
