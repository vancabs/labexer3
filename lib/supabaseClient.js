import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vronkmrgwugrteywvmch.supabase.co";
const supabaseAnonKey = "sb_publishable_JKglzkXvWNrOzxPUlIBRzw_tqsUW-TD"; // copy the full key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);