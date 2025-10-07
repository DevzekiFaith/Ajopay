import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    console.log("Admin health check called");
    
    // Check environment variables
    const envCheck = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    };

    if (!envCheck.hasSupabaseUrl || !envCheck.hasSupabaseAnonKey || !envCheck.hasSupabaseServiceKey) {
      return NextResponse.json({ 
        status: "error",
        message: "Missing environment variables",
        envCheck
      }, { status: 500 });
    }

    // Test authentication
    const supabase = getSupabaseServerClient();
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    
    if (authErr) {
      return NextResponse.json({ 
        status: "error",
        message: "Authentication error",
        error: authErr.message
      }, { status: 401 });
    }

    if (!authData?.user) {
      return NextResponse.json({ 
        status: "error",
        message: "No authenticated user"
      }, { status: 401 });
    }

    // Test admin client
    let adminClient;
    try {
      adminClient = getSupabaseAdminClient();
    } catch (error: any) {
      return NextResponse.json({ 
        status: "error",
        message: "Admin client initialization failed",
        error: error.message
      }, { status: 500 });
    }

    // Test database access
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, role")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ 
        status: "error",
        message: "Database access error",
        error: profileError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      status: "healthy",
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: profile?.role || 'customer'
      },
      envCheck,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Admin health check error:", error);
    return NextResponse.json({ 
      status: "error",
      message: "Internal server error",
      error: error.message
    }, { status: 500 });
  }
}
