const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const envFile = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : fs.readFileSync('.env.local', 'utf8');

let supabaseUrl = '';
let supabaseKey = '';

envFile.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.replace('VITE_SUPABASE_URL=', '').trim();
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.replace('VITE_SUPABASE_ANON_KEY=', '').trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabase.from('project_fields').select('*');
    if (error) console.error(error);
    else {
        // Group by project_id
        const map = {};
        for(const f of data) {
            if(!map[f.project_id]) map[f.project_id] = [];
            map[f.project_id].push(f.field_name);
        }
        console.log(JSON.stringify(map, null, 2));
    }
}
run();
