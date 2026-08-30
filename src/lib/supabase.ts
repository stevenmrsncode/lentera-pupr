import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://mfkggexjsosvyqxrndgy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_V0JsqRtAGzx0mBL0Zfb9kw_35SMlNM0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
