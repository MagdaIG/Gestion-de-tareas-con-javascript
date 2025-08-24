// Instala: npm i @supabase/supabase-js  (o usa CDN si no tienes bundler)
import { createClient } from '@supabase/supabase-js';

// 👇 TU URL está fija por tu Project ID
const SUPABASE_URL = 'https://njmebzqpzjvmndxiyfpq.supabase.co';

// 👇 Pega aquí tu anon public key (Settings → API → Project API keys → anon)
const SUPABASE_ANON_KEY = 'PEGA_TU_ANON_KEY_AQUI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
