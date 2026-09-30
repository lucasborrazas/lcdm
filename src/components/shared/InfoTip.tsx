"use client";

import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function InfoTip({ children }: { children: ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button type="button" className="text-muted-foreground hover:text-foreground">
            <Info className="h-3.5 w-3.5" />
          </button>
        }
      />
      <PopoverContent className="text-xs leading-relaxed">
        {children}
      </PopoverContent>
    </Popover>
  );
}
