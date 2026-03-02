import { createClient } from '@supabase/supabase-js';

const getValidUrl = (url: any): string => {
  if (typeof url !== 'string' || !url.startsWith('http')) {
    return 'https://placeholder.supabase.co';
  }
  try {
    new URL(url);
    return url;
  } catch (e) {
    return 'https://placeholder.supabase.co';
  }
};

let supabaseClient: any = null;

const createSafeClient = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  try {
    const url = getValidUrl(supabaseUrl);
    if (url === 'https://placeholder.supabase.co') {
       // Don't even try if it's the placeholder
       return null;
    }
    return createClient(url, supabaseAnonKey || 'placeholder');
  } catch (e) {
    console.error('Supabase client creation failed:', e);
    return null;
  }
};

export const supabase = {
  get auth() {
    if (!supabaseClient) {
      supabaseClient = createSafeClient();
    }
    
    if (!supabaseClient) {
      return {
        signInWithPassword: async () => ({ error: { message: 'Supabase not configured' } }),
        signUp: async () => ({ error: { message: 'Supabase not configured' } }),
        signOut: async () => ({ error: { message: 'Supabase not configured' } }),
        resetPasswordForEmail: async () => ({ error: { message: 'Supabase not configured' } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        getSession: async () => ({ data: { session: null }, error: null }),
      };
    }
    return supabaseClient.auth;
  }
};
