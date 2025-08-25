"use client";

import { createBrowserClient } from "@supabase/ssr";

export const getSupabaseBrowserClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  if (!url || !anonKey) {
    console.warn("Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  }
  return createBrowserClient(url ?? "https://epczlmqhwubfkloixeyj.supabase.co", anonKey ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwY3psbXFod3ViZmtsb2l4ZXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMDA1NTIsImV4cCI6MjA3MTU3NjU1Mn0.lb_U72FmbvQ3Yz099Sjv2HahCtaAwyiiCwy28VyJ6pU");
};
