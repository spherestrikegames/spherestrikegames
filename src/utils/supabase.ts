/**
 * Supabase Client Initialization for GitHub Pages & Web Deployment
 * 
 * Replace the placeholder variables below with your credentials from your
 * Supabase project Settings -> API page.
 */

export const SUPABASE_URL: string = "PASTE_YOUR_SUPABASE_URL_HERE";
export const SUPABASE_ANON_KEY: string = "PASTE_YOUR_ANON_KEY_HERE";

// Check if credentials have been replaced with real Supabase keys
export function isSupabaseConfigured(): boolean {
  const url = String(SUPABASE_URL || '').trim();
  const key = String(SUPABASE_ANON_KEY || '').trim();
  return (
    url !== "PASTE_YOUR_SUPABASE_URL_HERE" &&
    key !== "PASTE_YOUR_ANON_KEY_HERE" &&
    url.startsWith('http')
  );
}

// Global Supabase client instance (instantiated via CDN window.supabase or custom loader)
let supabaseClientInstance: any = null;

export function getSupabaseClient(): any {
  if (supabaseClientInstance) {
    return supabaseClientInstance;
  }

  if (isSupabaseConfigured()) {
    try {
      const globalSupabase = (typeof window !== 'undefined' ? (window as any).supabase : null);
      if (globalSupabase && typeof globalSupabase.createClient === 'function') {
        supabaseClientInstance = globalSupabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return supabaseClientInstance;
      }
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
    }
  }

  return null;
}

// Export default initialized client if available
export const supabase = getSupabaseClient();
