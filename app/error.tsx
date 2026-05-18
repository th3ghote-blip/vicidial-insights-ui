"use client";

/**
 * Next.js App Router error boundary for the root segment.
 * Catches unhandled errors in Server Components and Route Handlers.
 * Must be a Client Component (Next.js requirement).
 */
import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console so Railway logs / Sentry pick it up
    console.error("[GlobalError]", error.message, error.digest);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center space-y-5">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <AlertTriangle className="h-7 w-7 text-red-400" strokeWidth={1.5} />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-lg font-semibold text-zinc-100">Error al cargar el dashboard</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            No se pudo conectar con el servidor de datos. Comprueba tu conexión e inténtalo de nuevo.
          </p>
          {error.digest && (
            <p className="text-xs text-zinc-600 font-mono">ref: {error.digest}</p>
          )}
        </div>

        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors shadow-sm shadow-emerald-500/20"
        >
          <RefreshCw className="h-4 w-4" strokeWidth={2} />
          Reintentar
        </button>
      </div>
    </div>
  );
}
