import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vronkmrgwugrteywvmch.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyb25rbXJnd3VncnRleXd2bWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNjg2NDksImV4cCI6MjA5MTc0NDY0OX0.7N8Kusohp2SAm2fr-t4GknQ-Znlhmt4g0D_QpBin_Z0"; // copy the full key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);