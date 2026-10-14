"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(min-width: 768px)";

// true desde el breakpoint md (el mismo que usa Tailwind para md:).
export function useEsDesktop(): boolean {
  return useSyncExternalStore(
    (avisar) => {
      const mq = window.matchMedia(QUERY);
      mq.addEventListener("change", avisar);
      return () => mq.removeEventListener("change", avisar);
    },
    () => window.matchMedia(QUERY).matches,
    () => true
  );
}
