"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminTotalCard({
  title,
  totalNaira,
  subtitle,
  sparkPoints,
}: {
  title: string;
  totalNaira: number;
  subtitle?: string;
  sparkPoints?: string;
}) {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 600);
    return () => clearTimeout(t);
  }, [totalNaira]);

  return (
    <Card className="border border-white/20 dark:border-white/10 bg-white/30 dark:bg-neutral-900/60 backdrop-blur-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.25),_-6px_-6px_20px_rgba(255,255,255,0.05)]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-semibold transition-all ${pulse ? "animate-pulse" : ""}`}>
          ₦{Math.round(totalNaira).toLocaleString()}
        </div>
        {subtitle && <div className="text-xs opacity-70">{subtitle}</div>}
        {sparkPoints && (
          <svg viewBox="0 0 100 30" className="mt-2 w-full h-8 opacity-80">
            <polyline fill="none" stroke="currentColor" strokeWidth="1.5" points={sparkPoints} />
          </svg>
        )}
      </CardContent>
    </Card>
  );
}
