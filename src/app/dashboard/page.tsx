import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import DashboardLanding from "./DashboardLanding";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = getSupabaseServerClient();
  // If hub is requested, render it even if unauthenticated
  const params = await searchParams;
  const hub = params?.hub;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (hub && !user) {
    // Public hub view
    return <DashboardLanding defaultRole={"customer"} />;
  }

  if (!user) {
    redirect("/sign-in");
  }

  // Require explicit recent sign-in even if a Supabase session exists
  // We set this cookie client-side on successful sign-in/sign-up
  const cookieStore = await cookies();
  const recent = cookieStore.get("recent_auth");
  if (!recent) {
    redirect("/sign-in?reauth=1");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = (profile?.role as "customer" | "admin" | undefined) ?? "customer";

  // If hub is not set, redirect to role route; otherwise show hub
  if (!hub) {
    if (role === "customer") redirect("/customer");
    if (role === "admin") redirect("/admin");
  }

  return <DashboardLanding defaultRole={role} />;
}
