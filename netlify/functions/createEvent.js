// netlify/functions/createEvent.js
const { getSupabase } = require("./_helpers");

exports.handler = async (event) => {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Supabase not initialized" })
      };
    }

    const body = JSON.parse(event.body || "{}");

    const { title, description, event_time, user_email } = body;

    if (!title || !event_time || !user_email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" })
      };
    }

    const date = new Date(event_time).toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("events")
      .insert([
        {
          title,
          description,
          event_time,       // int8 timestamp
          date,             // yyyy-mm-dd
          user_email,
          sent: false,
          remind_at: null
        }
      ])
      .select("*");

    if (error) {
      console.error("❌ Supabase Insert Error:", error);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: error.message })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };

  } catch (err) {
    console.error("❌ Server Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.toString() })
    };
  }
};
