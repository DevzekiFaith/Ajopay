import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { email, full_name, business_name } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check caller role
    const { data: me, error: meErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (meErr) return NextResponse.json({ error: meErr.message }, { status: 500 });
    if (!me || !["agent", "admin"].includes(me.role)) {
      return NextResponse.json({ error: "Forbidden: only agents or admins may create customers" }, { status: 403 });
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

    // Ensure profile has correct fields (trigger inserts default; upsert to set name)
    const profileData: any = {
      id: newUser.id,
      email,
      full_name: full_name || null,
      role: "customer",
    };
    
    // Only add business_name if the column exists
    if (business_name) {
      profileData.business_name = business_name;
    }
    
    const { error: upsertErr } = await admin
      .from("profiles")
      .upsert(profileData, { onConflict: "id" });
    if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 });

    return NextResponse.json({ id: newUser.id, email, full_name: full_name || null, business_name: business_name || null });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}

