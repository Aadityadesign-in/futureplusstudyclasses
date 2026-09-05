// ==========================================
// Future Plus Study Classes
// Supabase Configuration
// ==========================================

// 1. Supabase Dashboard se Project URL paste karo
const SUPABASE_URL = "https://vzejqtawmpnuonddytkv.supabase.co";

// 2. Supabase Dashboard → Settings → API Keys
//    → Publishable key → default
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_IcGhbWXSWE33OmyKysPLqw_5lJz0v2U";

// ==========================================
// Create Supabase Client
// ==========================================

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    }
);

// ==========================================
// Make client available to other JS files
// ==========================================

window.supabaseClient = supabaseClient;

console.log("Supabase connected successfully!");