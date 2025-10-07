import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
        process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + "..." : "missing",
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV
    };

    console.log("Environment check:", envCheck);

    // Test server client
    let serverClientTest = { success: false, error: null };
    try {
      const serverClient = getSupabaseServerClient();
      serverClientTest = { success: true, error: null };
    } catch (error: any) {
      serverClientTest = { success: false, error: error.message };
    }

    // Test admin client
    let adminClientTest = { success: false, error: null };
    try {
      const adminClient = getSupabaseAdminClient();
      adminClientTest = { success: true, error: null };
    } catch (error: any) {
      adminClientTest = { success: false, error: error.message };
    }

    // Test database connection
    let dbTest: { success: boolean; error: string | null; data: string | null } = { success: false, error: null, data: null };
    try {
      const adminClient = getSupabaseAdminClient();
      const { data, error } = await adminClient
        .from("profiles")
        .select("count")
        .limit(1);
      
      if (error) {
        dbTest = { success: false, error: error.message, data: null };
      } else {
        dbTest = { success: true, error: null, data: "Connection successful" };
      }
    } catch (error: any) {
      dbTest = { success: false, error: error.message, data: null };
    }

    return NextResponse.json({
      environment: envCheck,
      serverClient: serverClientTest,
      adminClient: adminClientTest,
      database: dbTest,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
