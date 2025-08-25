import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { phone, user_metadata } = await req.json();
    if (!phone || typeof phone !== "string") {
      return NextResponse.json({ error: "phone (E.164) is required" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!url || !serviceKey) {
      return NextResponse.json({ error: "Server is missing SUPABASE env vars" }, { status: 500 });
    }

    const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    // Try to create user; if exists, treat as success
    const { data, error } = await supabase.auth.admin.createUser({
      phone,
      phone_confirm: false,
      user_metadata: user_metadata ?? {},
    });

    if (error) {
      // If user already exists or signups disabled, we still want to allow OTP flow
      const msg = (error as any)?.message?.toLowerCase?.() || "";
      if (msg.includes("already registered") || msg.includes("user already exists")) {
        return NextResponse.json({ ok: true, note: "already_exists" });
      }
      return NextResponse.json({ error: error.message || "createUser failed" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, user: data.user });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "unexpected error" }, { status: 500 });
  }
}
