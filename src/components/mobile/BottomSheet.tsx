"use client";

import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";

// Hoja inferior para mobile: esquinas superiores 24px, handle, overlay
// azulado, max-h 90% y scroll interno.
export function BottomSheet({
  open,
  onOpenChange,
  title,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <SheetPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <SheetPrimitive.Portal>
        <SheetPrimitive.Backdrop className="fixed inset-0 z-50 bg-[rgba(15,20,50,.45)] transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <SheetPrimitive.Popup
          // sin foco inicial: evita que se abra el teclado apenas aparece la hoja
          initialFocus={false}
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[90%] flex-col rounded-t-[24px] bg-popover text-popover-foreground shadow-lg outline-none transition duration-200 ease-out data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full",
            className
          )}
        >
          <div className="mx-auto mt-2.5 h-[5px] w-10 shrink-0 rounded-full bg-[hsl(210_25%_84%)]" />
          <SheetPrimitive.Title className="shrink-0 px-5 pb-2 pt-3 text-lg font-bold">
            {title}
          </SheetPrimitive.Title>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            {children}
          </div>
        </SheetPrimitive.Popup>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  );
}
