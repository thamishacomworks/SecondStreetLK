import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://rwhvjqpmgcgnswngymun.supabase.co";
const supabaseAnonKey = "sb_publishable_eEgoNaAoB2-SvvBdTRH0dg_D9KM6GF-";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);