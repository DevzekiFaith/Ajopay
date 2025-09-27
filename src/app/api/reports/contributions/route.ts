import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me, error: meErr } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (meErr) return NextResponse.json({ error: meErr.message }, { status: 500 });
  if (!me || me.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Fetch all contributions for admin report
  const { data: rows, error } = await supabase
    .from("contributions")
    .select("id, user_id, amount_kobo, method, status, contributed_at, created_at")
    .order("contributed_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const header = ["date", "user_id", "amount_naira", "method", "status", "created_at"].join(",");
  const body = (rows ?? [])
    .map((r) => [
      r.contributed_at, 
      r.user_id, 
      Math.round((r.amount_kobo ?? 0) / 100), 
      r.method, 
      r.status,
      r.created_at
    ].join(","))
    .join("\n");
  const csv = `${header}\n${body}`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=contributions_${new Date().toISOString().slice(0, 10)}.csv`,
    },
  });
}
