import { supabase } from "./_helpers.js";

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    const { title, description, date, event_time, user_email } = body;

    // Insert matching your EXACT table structure
    const { data, error } = await supabase
      .from("events")
      .insert([{
        title,
        description,
        date,
        event_time,
        'cibyj@hotmail.com',
        sent: false,          // default
        remind_at: null       // default
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
