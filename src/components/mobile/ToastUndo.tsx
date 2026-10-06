"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type ToastState = { id: number; msg: string; undo?: () => void };
type ToastFn = (msg: string, undo?: () => void) => void;

const Ctx = createContext<ToastFn>(() => {});

// Un toast a la vez, 5 s, con "Deshacer" opcional (mobile).
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mostrar = useCallback<ToastFn>((msg, undo) => {
    if (timer.current) clearTimeout(timer.current);
    const id = Date.now();
    setToast({ id, msg, undo });
    timer.current = setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 5000);
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const deshacer = () => {
    toast?.undo?.();
    if (timer.current) clearTimeout(timer.current);
    setToast(null);
  };

  return (
    <Ctx.Provider value={mostrar}>
      {children}
      {toast && (
        <div className="md:hidden fixed inset-x-4 bottom-24 z-[60] flex min-h-12 items-center justify-between gap-3 rounded-[14px] bg-[hsl(226_35%_14%)] px-4 py-2 text-[13.5px] text-white shadow-lg">
          <span>{toast.msg}</span>
          {toast.undo && (
            <button
              type="button"
              onClick={deshacer}
              className="shrink-0 text-sm font-bold text-[hsl(209_65%_72%)]"
            >
              Deshacer
            </button>
          )}
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx);
}
