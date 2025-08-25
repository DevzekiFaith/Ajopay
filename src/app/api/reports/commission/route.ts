import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me, error: meErr } = await supabase.from("profiles").select("role, cluster_id").eq("id", user.id).maybeSingle();
  if (meErr) return NextResponse.json({ error: meErr.message }, { status: 500 });
  if (!me || me.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Fetch contributions within cluster via profiles filter
  const { data: users } = await supabase.from("profiles").select("id").eq("cluster_id", me.cluster_id as any);
  const ids = (users ?? []).map((u: any) => u.id);

  const { data: rows, error } = await supabase
    .from("contributions")
    .select("id, user_id, agent_id, amount_kobo, method, contributed_at")
    .in("user_id", ids as any)
    .order("contributed_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const header = ["date", "user_id", "agent_id", "amount_naira", "method"].join(",");
  const body = (rows ?? [])
    .map((r) => [r.contributed_at, r.user_id, r.agent_id ?? "", Math.round((r.amount_kobo ?? 0) / 100), r.method].join(","))
    .join("\n");
  const csv = `${header}\n${body}`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=commission_${new Date().toISOString().slice(0, 10)}.csv`,
    },
  });
}
