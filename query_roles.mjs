import { createClient } from '@supabase/supabase-js';
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
const { data, error } = await supabase.from('profiles').select('role').limit(100);
console.log(JSON.stringify({ data, error }, null, 2));
