"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MorphModalProps {
  trigger: React.ReactNode;
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

export function MorphModal({ trigger, title, description, children }: MorphModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="max-w-md w-[92vw] sm:w-full rounded-2xl border border-white/20 dark:border-white/10 bg-white/20 dark:bg-white/10 backdrop-blur-2xl shadow-[8px_8px_24px_rgba(0,0,0,0.25),_-8px_-8px_24px_rgba(255,255,255,0.08)]"
     >
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle className="tracking-tight">{title}</DialogTitle>}
            {description && (
              <DialogDescription className="opacity-80 text-sm">{description}</DialogDescription>
            )}
          </DialogHeader>
        )}
        <div className="mt-2">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
