import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    
    // Test basic connection
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    
    console.log('Auth test - User data:', authData);
    console.log('Auth test - Auth error:', authErr);
    
    if (authErr) {
      return NextResponse.json({
        success: false,
        error: 'Authentication failed',
        details: authErr.message,
        code: authErr.status
      });
    }
    
    if (!authData?.user) {
      return NextResponse.json({
        success: false,
        error: 'No user found',
        message: 'User is not authenticated'
      });
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        created_at: authData.user.created_at
      },
      message: 'Authentication successful'
    });
    
  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}


