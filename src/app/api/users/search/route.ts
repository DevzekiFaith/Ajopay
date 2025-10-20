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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters long' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdminClient();

    // Search by email or phone number
    const { data: users, error: searchError } = await admin
      .from('profiles')
      .select('id, email, full_name, phone, avatar_url')
      .or(`email.ilike.%${query}%,phone.ilike.%${query}%,full_name.ilike.%${query}%`)
      .neq('id', authData.user.id) // Exclude current user
      .limit(10);

    if (searchError) {
      console.error('User search error:', searchError);
      return NextResponse.json(
        { error: 'Failed to search users' },
        { status: 500 }
      );
    }

    // Filter out users without email (incomplete profiles)
    const validUsers = users?.filter(user => user.email) || [];

    return NextResponse.json({
      success: true,
      users: validUsers,
      count: validUsers.length
    });

  } catch (error) {
    console.error('User search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}