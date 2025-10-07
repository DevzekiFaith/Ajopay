import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { user_id, amount_kobo, method = "wallet", status = "confirmed", contributed_at } = await request.json();

    // Use sample user if no user_id provided
    const finalUserId = user_id || "00000000-0000-0000-0000-000000000001";
    
    if (!amount_kobo) {
      return NextResponse.json({ error: "Missing amount_kobo" }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();
    const date = contributed_at ?? new Date().toISOString().slice(0, 10);

    const { error } = await admin.from("contributions").insert({
      user_id: finalUserId,
      amount_kobo,
      method,
      status,
      contributed_at: date,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}



