import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseServerClient();
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    
    if (authErr || !authData?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = authData.user;
    const admin = getSupabaseAdminClient();
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    // Build query
    let query = admin
      .from("transactions")
      .select("*", { count: 'exact' })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (type) {
      query = query.eq("type", type);
    }
    
    if (status) {
      query = query.eq("status", status);
    }

    const { data: transactions, count, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    // Calculate summary statistics
    const summary = {
      totalTransactions: count || 0,
      totalDeposits: transactions?.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount_kobo, 0) || 0,
      totalWithdrawals: transactions?.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + Math.abs(t.amount_kobo), 0) || 0,
      totalSent: transactions?.filter(t => t.type === 'send').reduce((sum, t) => sum + Math.abs(t.amount_kobo), 0) || 0,
      totalReceived: transactions?.filter(t => t.type === 'receive').reduce((sum, t) => sum + t.amount_kobo, 0) || 0,
      totalCommissions: transactions?.filter(t => t.type === 'commission').reduce((sum, t) => sum + t.amount_kobo, 0) || 0,
      pendingTransactions: transactions?.filter(t => t.status === 'pending').length || 0,
      completedTransactions: transactions?.filter(t => t.status === 'completed').length || 0,
      failedTransactions: transactions?.filter(t => t.status === 'failed').length || 0
    };

    return NextResponse.json({
      success: true,
      transactions: transactions || [],
      summary,
      pagination: {
        limit,
        offset,
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      }
    });

  } catch (error) {
    console.error('Transactions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseServerClient();
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    
    if (authErr || !authData?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = authData.user;
    const { type, amount, description, status = 'completed', metadata } = await request.json();

    if (!type || !amount) {
      return NextResponse.json(
        { error: 'Type and amount are required' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdminClient();
    const amountKobo = Math.round(amount * 100);
    const referenceId = Date.now().toString().slice(-8);
    
    const { data: transaction, error: transactionError } = await admin
      .from("transactions")
      .insert({
        user_id: user.id,
        type: type,
        amount_kobo: amountKobo,
        reference: `${type.toUpperCase()}-${referenceId}`,
        description: description || `${type} transaction`,
        status: status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      return NextResponse.json(
        { error: 'Failed to create transaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction,
      message: 'Transaction created successfully'
    });

  } catch (error) {
    console.error('Create transaction API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}