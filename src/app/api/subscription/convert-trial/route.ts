import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const { paymentReference, amountPaidKobo, userId } = await req.json();

    if (!paymentReference || !amountPaidKobo) {
      return NextResponse.json({ error: "Payment reference and amount are required" }, { status: 400 });
    }

    // If userId is provided, convert specific user's trial
    if (userId) {
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'active',
          subscription_started_at: new Date().toISOString(),
          payment_reference: paymentReference,
          amount_paid_kobo: amountPaidKobo,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('status', 'trial')
        .select()
        .single();

      if (error) {
        console.error('Error converting trial to paid:', error);
        return NextResponse.json({ error: "Failed to convert trial to paid" }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        subscription 
      });
    }

    // If no userId provided, this might be called from webhook
    // We'll need to find the user by payment reference or other means
    return NextResponse.json({ 
      error: "User ID is required for trial conversion" 
    }, { status: 400 });

  } catch (error: any) {
    console.error('Trial conversion error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}








