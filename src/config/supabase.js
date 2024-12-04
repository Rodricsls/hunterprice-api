const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config()

const supabaseClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

module.exports = supabaseClient