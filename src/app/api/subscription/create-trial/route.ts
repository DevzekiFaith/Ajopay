import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Check if user already has a subscription
    const { data: existingSubscription, error: checkError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing subscription:', checkError);
      return NextResponse.json({ error: "Failed to check existing subscription" }, { status: 500 });
    }

    if (existingSubscription) {
      return NextResponse.json({ 
        error: "User already has a subscription",
        subscription: existingSubscription 
      }, { status: 400 });
    }

    // Create trial subscription
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 4); // 4-day trial

    const { data: subscription, error: createError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_type: 'king_elite',
        status: 'trial',
        trial_ends_at: trialEndsAt.toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating trial subscription:', createError);
      return NextResponse.json({ error: "Failed to create trial subscription" }, { status: 500 });
    }

    console.log('✅ Trial subscription created:', subscription);

    return NextResponse.json({ 
      success: true, 
      subscription,
      trialEndsAt: trialEndsAt.toISOString()
    });

  } catch (error: any) {
    console.error('Trial subscription creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


