import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export async function POST(request: Request) {
  const admin = getSupabaseAdminClient();
  const secret = process.env.PAYSTACK_SECRET_KEY || '';

  try {
    const raw = await request.text();
    const signature = request.headers.get('x-paystack-signature') || '';
    const hash = crypto.createHmac('sha512', secret).update(raw).digest('hex');
    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(raw);
    const eventType = event?.event;
    const data = event?.data || {};

    // For transfers, reference is in data.reference
    const reference: string | undefined = data?.reference;
    if (!reference) {
      return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
    }

    if (eventType === 'transfer.success') {
      // Mark transaction completed
      await admin
        .from('transactions')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('reference', reference);
    }

    if (eventType === 'transfer.failed' || eventType === 'transfer.reversed') {
      // Mark transaction failed and refund wallet
      const { data: tx } = await admin
        .from('transactions')
        .select('*')
        .eq('reference', reference)
        .maybeSingle();

      if (tx && tx.user_id && tx.amount_kobo) {
        // Refund wallet balance (amount_kobo is negative for withdrawals)
        await admin
          .rpc('increment_wallet_balance', {
            p_profile_id: tx.user_id,
            p_amount_kobo: Math.abs(tx.amount_kobo)
          });
      }

      await admin
        .from('transactions')
        .update({ status: 'failed' })
        .eq('reference', reference);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}










