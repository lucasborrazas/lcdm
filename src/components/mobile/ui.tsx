"use client";

import { cn } from "@/lib/utils";

export function Chip({
  active,
  color,
  onClick,
  children,
  className,
}: {
  active?: boolean;
  // color del horario (hex); si no hay, usa el primary
  color?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={active && color ? { backgroundColor: color, borderColor: color } : undefined}
      className={cn(
        "inline-flex h-9 shrink-0 items-center rounded-full border px-3.5 text-[13px] font-semibold transition-colors",
        active
          ? cn("text-white", !color && "border-primary bg-primary")
          : "border-border bg-background text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-[13px] font-semibold transition-colors",
            value === o.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          )}
        >
          {o.label}
          {o.count != null && (
            <span className="text-[11px] font-bold opacity-70">{o.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function SwitchGrande({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "flex h-[34px] w-[58px] shrink-0 rounded-full p-[3px] transition-all duration-150",
        checked ? "justify-end bg-[hsl(152_55%_36%)]" : "justify-start bg-[hsl(210_25%_84%)]"
      )}
    >
      <span className="h-7 w-7 rounded-full bg-white shadow" />
    </button>
  );
}

export function Fab({
  onClick,
  children,
  disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="md:hidden fixed bottom-24 right-4 z-40 flex h-[52px] items-center gap-2 rounded-full bg-primary px-5 text-[15px] font-semibold text-primary-foreground shadow-lg disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function EtiquetaSeccion({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-semibold uppercase tracking-[.5px] text-muted-foreground">
      {children}
    </p>
  );
}
