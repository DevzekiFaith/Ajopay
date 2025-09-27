"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const run = async () => {
      const supabase = getSupabaseBrowserClient();
      try {
        // Get the code from URL search params
        const code = searchParams.get('code');
        if (!code) {
          throw new Error('No authorization code found');
        }
        
        // Handles the auth redirect (PKCE) and sets the session cookies
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
        toast.success("Signed in");
        router.replace("/dashboard");
      } catch (err: any) {
        toast.error(err.message || "Sign-in failed");
        // Fallback: go to sign-in
        router.replace("/sign-in");
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center">
      <p className="opacity-80 text-sm">Completing sign-in…</p>
    </div>
  );
}
