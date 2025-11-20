// netlify/functions/_helpers.js
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client immediately
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase environment variables.");
}

module.exports = { supabase };
