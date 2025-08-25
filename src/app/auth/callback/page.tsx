"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const supabase = getSupabaseBrowserClient();
      try {
        // Handles the auth redirect (PKCE) and sets the session cookies
        const { error } = await supabase.auth.exchangeCodeForSession();
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
  }, []);

  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center">
      <p className="opacity-80 text-sm">Completing sign-in…</p>
    </div>
  );
}
