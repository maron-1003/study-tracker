import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dczepxufzrcokbckussn.supabase.co";
const supabaseKey = "sb_publishable_tVAY3ug75iZ3HL-wxgQzug_9j93QJo8";

export const supabase = createClient(supabaseUrl, supabaseKey);
