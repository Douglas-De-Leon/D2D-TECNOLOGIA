import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nllglkxohrpdwqcbjqse.supabase.co';
const supabaseKey = 'sb_publishable_deU_sEm5NFwnWKiAjofM4w_b7ee4k8O';

export const supabase = createClient(supabaseUrl, supabaseKey);