import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { email, full_name, business_name, cluster_id } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check caller role + cluster
    const { data: me, error: meErr } = await supabase
      .from("profiles")
      .select("role, cluster_id")
      .eq("id", user.id)
      .maybeSingle();
    if (meErr) return NextResponse.json({ error: meErr.message }, { status: 500 });
    if (!me || !["agent", "admin"].includes(me.role)) {
      return NextResponse.json({ error: "Forbidden: only agents or admins may create customers" }, { status: 403 });
    }

    // If an explicit cluster_id is provided, verify the caller owns that cluster.
    let targetClusterId: string | null = me.cluster_id ?? null;
    if (cluster_id && typeof cluster_id === "string") {
      const { data: cluster, error: cErr } = await supabase
        .from("clusters")
        .select("id, agent_id")
        .eq("id", cluster_id)
        .maybeSingle();
      if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
      if (cluster && cluster.agent_id === user.id) {
        targetClusterId = cluster.id;
      } else {
        return NextResponse.json({ error: "Invalid cluster: not found or not owned by you" }, { status: 403 });
      }
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!url || !serviceKey) {
      return NextResponse.json({ error: "Server is missing Supabase env vars" }, { status: 500 });
    }

    const admin = createClient(url, serviceKey);

    // Create auth user
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: full_name || null, business_name: business_name || null },
    });
    if (createErr) return NextResponse.json({ error: createErr.message }, { status: 400 });
    const newUser = created.user;
    if (!newUser) return NextResponse.json({ error: "Failed to create user" }, { status: 500 });

    // Ensure profile has correct fields (trigger inserts default; upsert to set cluster/name)
    const { error: upsertErr } = await admin
      .from("profiles")
      .upsert(
        {
          id: newUser.id,
          email,
          full_name: full_name || null,
          role: "customer",
          cluster_id: targetClusterId,
          business_name: business_name || null,
        },
        { onConflict: "id" }
      );
    if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 });

    return NextResponse.json({ id: newUser.id, email, full_name: full_name || null, business_name: business_name || null, cluster_id: targetClusterId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}

