"use client";

import { createBrowserClient } from "@supabase/ssr";

// Fallback values for development
const FALLBACK_URL = "https://epczlmqhwubfkloixeyj.supabase.co";
const FALLBACK_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwY3psbXFod3ViZmtsb2l4ZXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMDA1NTIsImV4cCI6MjA3MTU3NjU1Mn0.lb_U72FmbvQ3Yz099Sjv2HahCtaAwyiiCwy28VyJ6pU";

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export const getSupabaseBrowserClient = () => {
  // Return cached client if available
  if (supabaseClient) {
    return supabaseClient;
  }

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
    
    if (!url || !anonKey) {
      console.warn("Supabase env vars missing. Using fallback values for development.");
      console.warn("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local for production");
    }

    const finalUrl = url || FALLBACK_URL;
    const finalKey = anonKey || FALLBACK_ANON_KEY;

    supabaseClient = createBrowserClient(finalUrl, finalKey);
    
    // Add error handling to the client
    supabaseClient.auth.onAuthStateChange((event: any, session: any) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        console.log('Auth state changed:', event);
      }
    });

    return supabaseClient;
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    // Return a fallback client
    return createBrowserClient(FALLBACK_URL, FALLBACK_ANON_KEY);
  }
};

// Utility function to handle Supabase errors gracefully
export const handleSupabaseError = (error: any, context: string = 'Supabase operation') => {
  console.error(`${context} failed:`, error);
  
  if (error?.message) {
    return {
      success: false,
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    };
  }
  
  return {
    success: false,
    error: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR'
  };
};

// Utility function for safe async operations
export const safeAsync = async <T>(
  operation: () => Promise<T>,
  fallback?: T,
  context: string = 'Async operation'
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    console.error(`${context} failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: fallback
    };
  }
};
