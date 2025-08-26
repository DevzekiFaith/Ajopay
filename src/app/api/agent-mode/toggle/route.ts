import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// POST /api/agent-mode/toggle
// Toggles the current user's role between 'agent' and 'customer'.
// When enabling agent mode, ensures a cluster exists (creates one if missing) and assigns it.
export async function POST() {
  try {
    const supabase = getSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: me, error: meErr } = await supabase
      .from("profiles")
      .select("id, role, cluster_id, full_name, email")
      .eq("id", user.id)
      .maybeSingle();
    if (meErr) return NextResponse.json({ error: meErr.message }, { status: 500 });
    if (!me) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!url || !serviceKey) return NextResponse.json({ error: "Server env missing" }, { status: 500 });
    const admin = createClient(url, serviceKey);

    // Toggle logic
    if (me.role === "agent") {
      // Demote to customer (keep cluster_id as-is)
      const { error: updErr } = await admin.from("profiles").update({ role: "customer" }).eq("id", user.id);
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
      return NextResponse.json({ role: "customer", cluster_id: me.cluster_id ?? null });
    } else {
      // Promote to agent and ensure cluster
      let clusterId = me.cluster_id as string | null;
      if (!clusterId) {
        const { data: createdCluster, error: cErr } = await admin
          .from("clusters")
          .insert({ name: `Cluster of ${user.id.slice(0, 8)}`, agent_id: user.id })
          .select("id")
          .single();
        if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
        clusterId = createdCluster.id;
      }
      const { error: updErr } = await admin.from("profiles").update({ role: "agent", cluster_id: clusterId }).eq("id", user.id);
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
      return NextResponse.json({ role: "agent", cluster_id: clusterId });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
