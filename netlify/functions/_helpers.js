// netlify/functions/_helpers.js
const { createClient } = require("@supabase/supabase-js");

function getSupabase() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Missing Supabase environment variables.");
    return null;
  }

  try {
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  } catch (error) {
    console.error("❌ Supabase initialization error:", error);
    return null;
  }
}

module.exports = { getSupabase };
