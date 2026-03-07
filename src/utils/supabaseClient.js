import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ppsudwcsshczovcgjalr.supabase.co'
const supabaseKey = 'sb_publishable_rIjhEQby5GS8YMm2N8eGvQ_azFTTTma'

export const supabase = createClient(supabaseUrl, supabaseKey)
