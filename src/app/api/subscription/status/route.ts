import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Get subscription status using the database function
    const { data, error } = await supabase.rpc('get_user_subscription_status', {
      user_uuid: userId
    });

    if (error) {
      console.error('Error getting subscription status:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Fallback: try to get subscription data directly from the table
      try {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          return NextResponse.json({ 
            error: "Failed to get subscription status", 
            details: error.message 
          }, { status: 500 });
        }

        // Return default status if no subscription found
        const defaultStatus = {
          has_subscription: !!fallbackData,
          status: fallbackData?.status || 'none',
          trial_active: fallbackData?.status === 'trial' && new Date() < new Date(fallbackData.trial_ends_at),
          trial_ends_at: fallbackData?.trial_ends_at || null,
          subscription_active: fallbackData?.status === 'active' && (!fallbackData.subscription_ends_at || new Date() < new Date(fallbackData.subscription_ends_at)),
          plan_type: fallbackData?.plan_type || null,
          trial_started_at: fallbackData?.trial_started_at || null,
          subscription_started_at: fallbackData?.subscription_started_at || null
        };

        return NextResponse.json({ 
          success: true, 
          subscription: defaultStatus 
        });
      } catch (fallbackErr) {
        console.error('Fallback mechanism failed:', fallbackErr);
        return NextResponse.json({ 
          error: "Failed to get subscription status", 
          details: error.message 
        }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      subscription: data 
    });

  } catch (error: any) {
    console.error('Subscription status error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: error.message || "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}


