"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export function SearchSelectFilter({
  label,
  placeholder,
  options,
  selected,
  onChange,
  className,
}: {
  label: string;
  placeholder: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
  className?: string;
}) {
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickFuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, []);

  const opcionesFiltradas = texto.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(texto.trim().toLowerCase()))
    : options;

  const toggle = (value: string) => {
    onChange(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]
    );
  };

  const limpiar = () => {
    onChange([]);
    setTexto("");
  };

  const textoResumen =
    selected.length === 0
      ? ""
      : selected.length <= 2
        ? options.filter((o) => selected.includes(o.value)).map((o) => o.label).join(", ")
        : `${selected.length} seleccionados`;

  const valorInput = abierto ? texto : textoResumen;

  return (
    <div className={cn("relative", className)} ref={ref}>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={valorInput}
          onChange={(e) => {
            setTexto(e.target.value);
            setAbierto(true);
          }}
          onFocus={() => {
            setAbierto(true);
            setTexto("");
          }}
          className={selected.length > 0 ? "pr-7" : undefined}
        />
        {selected.length > 0 && !abierto && (
          <button
            type="button"
            onClick={limpiar}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {abierto && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 max-h-56 overflow-y-auto">
          {opcionesFiltradas.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">Sin resultados</p>
          ) : (
            opcionesFiltradas.map((o) => (
              <label
                key={o.value}
                className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
              >
                <Checkbox checked={selected.includes(o.value)} onCheckedChange={() => toggle(o.value)} />
                {o.label}
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}
