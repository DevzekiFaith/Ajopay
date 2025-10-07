import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const admin = getSupabaseAdminClient();
    
    // Check if the user-settings bucket exists
    const { data: buckets, error } = await admin.storage.listBuckets();
    
    if (error) {
      console.error("Error listing buckets:", error);
      return NextResponse.json({ 
        error: "Failed to check storage buckets",
        details: error.message 
      }, { status: 500 });
    }
    
    const userSettingsBucket = buckets?.find(bucket => bucket.name === 'user-settings');
    const bucketExists = !!userSettingsBucket;
    
    return NextResponse.json({
      bucketExists,
      bucketName: 'user-settings',
      bucketDetails: userSettingsBucket || null,
      allBuckets: buckets?.map(b => b.name) || []
    });

  } catch (error: any) {
    console.error("Storage check error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to check storage" 
    }, { status: 500 });
  }
}
