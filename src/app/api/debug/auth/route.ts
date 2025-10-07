import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    
    if (authErr) {
      return NextResponse.json({
        authenticated: false,
        error: authErr.message,
        details: authErr
      });
    }

    if (!authData?.user) {
      return NextResponse.json({
        authenticated: false,
        error: 'No user found',
        user: null
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        created_at: authData.user.created_at
      }
    });

  } catch (error) {
    console.error('Auth debug error:', error);
    return NextResponse.json({
      authenticated: false,
      error: 'Server error',
      details: error
    }, { status: 500 });
  }
}
