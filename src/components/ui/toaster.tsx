'use client'

import * as React from "react"
import { useTheme } from "next-themes"
import { ToastProvider, ToastViewport } from "@/components/ui/toast"

export function Toaster() {
  useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <ToastProvider>
      <ToastViewport className="top-0 right-0 flex flex-col p-4" />
    </ToastProvider>
  )
}
