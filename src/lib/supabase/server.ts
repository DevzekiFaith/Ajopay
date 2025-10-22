import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const getSupabaseServerClient = () => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

    return createServerClient(
      url ?? "https://epczlmqhwubfkloixeyj.supabase.co",
      anonKey ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwY3psbXFod3ViZmtsb2l4ZXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMDA1NTIsImV4cCI6MjA3MTU3NjU1Mn0.lb_U72FmbvQ3Yz099Sjv2HahCtaAwyiiCwy28VyJ6pU",
      {
        cookies: {
          async get(name: string) {
            try {
              return (await cookies()).get(name)?.value;
            } catch (error) {
              console.error('Error getting cookie:', error);
              return undefined;
            }
          },
          async set(name: string, value: string, options: Record<string, unknown>) {
            // In Server Components, mutating cookies throws. Make it a safe no-op.
            try {
              (await cookies()).set(name, value, options);
            } catch (error) {
              console.error('Error setting cookie:', error);
            }
          },
          async remove(name: string, options: Record<string, unknown>) {
            // In Server Components, mutating cookies throws. Make it a safe no-op.
            try {
              (await cookies()).set(name, "", { ...options, maxAge: 0 });
            } catch (error) {
              console.error('Error removing cookie:', error);
            }
          },
        },
      }
    );
  } catch (error) {
    console.error('Error creating Supabase server client:', error);
    // Return a fallback client or throw a more descriptive error
    throw new Error('Failed to initialize Supabase client. Please check your environment variables.');
  }
};
