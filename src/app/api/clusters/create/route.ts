import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// POST /api/clusters/create
// Allows agents/admins to create a cluster and assigns it to themselves
export async function POST(req: Request) {
  try {
    const { name } = await req.json().catch(() => ({ name: undefined }));

    const supabase = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch caller profile (we will promote to agent if needed)
    const { data: me, error: meErr } = await supabase
      .from("profiles")
      .select("role, cluster_id")
      .eq("id", user.id)
      .maybeSingle();
    if (meErr) return NextResponse.json({ error: meErr.message }, { status: 500 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!url || !serviceKey) {
      return NextResponse.json({ error: "Server is missing Supabase env vars" }, { status: 500 });
    }
    const admin = createClient(url, serviceKey);

    // Create cluster owned by caller
    const clusterName = typeof name === "string" && name.trim().length > 0 ? name.trim() : `Cluster of ${user.id.slice(0, 8)}`;
    // Insert with agent_id if column exists; otherwise fallback without it
    let createdCluster: { id: string; name: string } | null = null;
    let insertErr: string | null = null;
    {
      const { data, error } = await admin
        .from("clusters")
        .insert({ name: clusterName, agent_id: user.id } as any)
        .select("id, name")
        .single();
      if (!error && data) {
        createdCluster = data as any;
      } else if (error) {
        insertErr = error.message;
      }
    }
    if (!createdCluster && insertErr && /agent_id.*does not exist|column\s+agent_id/i.test(insertErr)) {
      const { data, error } = await admin
        .from("clusters")
        .insert({ name: clusterName } as any)
        .select("id, name")
        .single();
      if (!error && data) {
        createdCluster = data as any;
        insertErr = null;
      }
    }
    if (!createdCluster) return NextResponse.json({ error: insertErr || "Failed to create cluster" }, { status: 400 });

    // Assign caller's profile to this cluster and ensure role 'agent'
    const { error: updErr } = await admin
      .from("profiles")
      .update({ cluster_id: createdCluster.id, role: "agent" })
      .eq("id", user.id);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    return NextResponse.json({ id: createdCluster.id, name: createdCluster.name });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
