"use client";

import { usePathname } from "next/navigation";
import { Nav } from "./nav";

export function ConditionalNav() {
  const pathname = usePathname();
  
  // Hide navigation on auth pages
  const hideNav = pathname?.startsWith('/sign-in') || 
                  pathname?.startsWith('/sign-up') || 
                  pathname?.startsWith('/reset-password');
  
  if (hideNav) {
    return null;
  }
  
  return <Nav />;
}
