"use client";

import { Toaster } from "sonner";
import { useTheme } from "next-themes";

export function ToastProvider() {
  const { theme } = useTheme();

  return (
    <Toaster
      theme={theme as "light" | "dark" | "system"}
      position="top-right"
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        style: {
          background: theme === 'dark' ? 'hsl(var(--background))' : 'hsl(var(--background))',
          border: theme === 'dark' ? '1px solid hsl(var(--border))' : '1px solid hsl(var(--border))',
          color: theme === 'dark' ? 'hsl(var(--foreground))' : 'hsl(var(--foreground))',
        },
        className: 'ajopay-toast',
      }}
    />
  );
}


