import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase Config Check:', {
    url: supabaseUrl ? supabaseUrl.substring(0, 15) + '...' : 'MISSING',
    key: supabaseAnonKey ? 'PRESENT' : 'MISSING'
});

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        storageKey: 'supabase.auth.token',
    }
});

// Make supabase available globally for debugging
window.supabase = supabase;
