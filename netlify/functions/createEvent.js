import { supabase } from "./_helpers.js";

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    const { title, description, event_time, user_email } = body;

    if (!user_email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "user_email is required" })
      };
    }

    const { data, error } = await supabase
      .from("events")
      .insert([{
        title,
        description,
        event_time,
        date: new Date(event_time).toISOString().split("T")[0],
        user_email,
        sent: false,
        remind_at: null
      }]);

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
