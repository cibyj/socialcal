import { supabase } from "./_helpers.js";

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    // Extract fields coming from frontend
    const { title, description, date, event_time, user_email, remind_at } = body;

    // Basic validation to catch missing fields
    if (!title || !date || !event_time || !user_email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields." }),
      };
    }

    // Insert EXACTLY matching your table structure
    const { data, error } = await supabase
      .from("events")
      .insert([
        {
          title,
          description,
          event_time,
          date,
          user_email,      // THIS was broken before
          sent: false,     // default
          remind_at: remind_at || null
        }
      ])
      .select();

    if (error) {
      console.error("Supabase Insert Error:", error);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: error.message }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, event: data }),
    };

  } catch (err) {
    console.error("Server Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.toString() }),
    };
  }
};
