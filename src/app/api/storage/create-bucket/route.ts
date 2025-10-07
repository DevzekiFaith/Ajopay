import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const admin = getSupabaseAdminClient();
    
    // Create the user-settings bucket
    const { data, error } = await admin.storage.createBucket('user-settings', {
      public: false, // Private bucket
      allowedMimeTypes: ['application/json'], // Only allow JSON files
      fileSizeLimit: 1024 * 1024, // 1MB limit
    });
    
    if (error) {
      console.error("Error creating bucket:", error);
      return NextResponse.json({ 
        error: "Failed to create storage bucket",
        details: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Storage bucket created successfully",
      bucket: data
    });

  } catch (error: any) {
    console.error("Bucket creation error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to create storage bucket" 
    }, { status: 500 });
  }
}
