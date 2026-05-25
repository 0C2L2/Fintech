"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface RPlotProps {
  endpoint: string;    // e.g. "segmentation"
  alt: string;
  className?: string;
}

export function RPlot({ endpoint, alt, className = "" }: RPlotProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let objectUrl: string | null = null;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Not authenticated");

        const res = await fetch(`${API_BASE}/admin/plots/${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`Plot unavailable (${res.status})`);

        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch (e: any) {
        setError(e.message || "Failed to load plot");
      } finally {
        setLoading(false);
      }
    };

    load();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [endpoint]);

  if (loading) {
    return (
      <div className={`animate-pulse bg-slate-100 rounded-xl flex items-center justify-center h-[280px] ${className}`}>
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Generating R plot…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-xl flex items-center justify-center h-[200px] ${className}`}>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src!}
      alt={alt}
      className={`w-full rounded-xl border border-slate-100 shadow-sm ${className}`}
    />
  );
}
