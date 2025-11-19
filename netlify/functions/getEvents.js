// netlify/functions/getEvents.js
const { getSupabase } = require("./_helpers");

exports.handler = async () => {
  try {
    const supabase = getSupabase();

    if (!supabase) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Supabase not initialized" }),
      };
    }

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      console.error("❌ Supabase query error:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error("❌ Unexpected server error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Unexpected server error" }),
    };
  }
};
