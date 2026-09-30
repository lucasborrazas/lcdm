"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

export function MultiSelectFilter({
  label,
  placeholderTodos,
  options,
  selected,
  onChange,
  className,
}: {
  label: string;
  placeholderTodos: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
  className?: string;
}) {
  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  };

  const textoBoton =
    selected.length === 0 || selected.length === options.length
      ? placeholderTodos
      : selected.length <= 2
        ? options
            .filter((o) => selected.includes(o.value))
            .map((o) => o.label)
            .join(", ")
        : `${selected.length} seleccionados`;

  return (
    <div className={className}>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" className="w-full justify-between font-normal">
              <span className="truncate">{textoBoton}</span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          }
        />
        <DropdownMenuContent align="start" className="w-56">
          {options.map((o) => (
            <DropdownMenuCheckboxItem
              key={o.value}
              checked={selected.includes(o.value)}
              onCheckedChange={() => toggle(o.value)}
              closeOnClick={false}
            >
              {o.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
