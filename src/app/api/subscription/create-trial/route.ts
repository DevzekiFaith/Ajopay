import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Create trial subscription API called');
    
    const { userId } = await req.json();
    console.log('📝 User ID received:', userId);

    if (!userId) {
      console.error('❌ No user ID provided');
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Missing Supabase environment variables');
      console.error('NEXT_PUBLIC_SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.error('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    console.log('✅ Environment variables check passed');

    // Check if user already has a subscription
    console.log('🔍 Checking for existing subscription for user:', userId);
    const { data: existingSubscription, error: checkError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking existing subscription:', checkError);
      console.error('Error details:', JSON.stringify(checkError, null, 2));
      return NextResponse.json({ 
        error: "Failed to check existing subscription",
        details: checkError.message 
      }, { status: 500 });
    }

    console.log('📊 Existing subscription check result:', existingSubscription);

    if (existingSubscription) {
      console.log('✅ User already has subscription:', existingSubscription);
      return NextResponse.json({ 
        success: true,
        message: "User already has a subscription",
        subscription: existingSubscription 
      });
    }

    // Create trial subscription
    console.log('🎯 Creating new trial subscription');
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 4); // 4-day trial

    const subscriptionData = {
      user_id: userId,
      plan_type: 'king_elite',
      status: 'trial',
      trial_started_at: new Date().toISOString(),
      trial_ends_at: trialEndsAt.toISOString()
    };

    console.log('📝 Creating trial subscription with data:', subscriptionData);

    const { data: subscription, error: createError } = await supabase
      .from('user_subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating trial subscription:', createError);
      console.error('Error details:', JSON.stringify(createError, null, 2));
      console.error('Error code:', createError.code);
      console.error('Error hint:', createError.hint);
      return NextResponse.json({ 
        error: "Failed to create trial subscription",
        details: createError.message,
        code: createError.code,
        hint: createError.hint
      }, { status: 500 });
    }

    console.log('✅ Trial subscription created successfully:', subscription);

    return NextResponse.json({ 
      success: true, 
      subscription,
      trialEndsAt: trialEndsAt.toISOString(),
      message: "Trial subscription created successfully"
    });

  } catch (error: any) {
    console.error('Trial subscription creation error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: error.message || "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}


