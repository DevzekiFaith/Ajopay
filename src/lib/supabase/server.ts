import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const getSupabaseServerClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

  return createServerClient(
    url ?? "https://epczlmqhwubfkloixeyj.supabase.co",
    anonKey ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwY3psbXFod3ViZmtsb2l4ZXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMDA1NTIsImV4cCI6MjA3MTU3NjU1Mn0.lb_U72FmbvQ3Yz099Sjv2HahCtaAwyiiCwy28VyJ6pU",
    {
      cookies: {
        async get(name: string) {
          return (await cookies()).get(name)?.value;
        },
        async set(name: string, value: string, options: Record<string, unknown>) {
          // In Server Components, mutating cookies throws. Make it a safe no-op.
          try {
            (await cookies()).set(name, value, options);
          } catch {}
        },
        async remove(name: string, options: Record<string, unknown>) {
          // In Server Components, mutating cookies throws. Make it a safe no-op.
          try {
            (await cookies()).set(name, "", { ...options, maxAge: 0 });
          } catch {}
        },
      },
    }
  );
};
