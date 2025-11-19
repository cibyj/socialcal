// netlify/functions/createEvent.js

const { createClient } = require("@supabase/supabase-js");

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase environment variables.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

exports.handler = async function (event, context) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed. Use POST." }),
      };
    }

    const body = JSON.parse(event.body);
    const { title, description, date, event_time, user_email } = body;

    if (!title || !date || !event_time) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields: title, date, event_time" }),
      };
    }

    // Insert new event into Supabase
    const { data, error } = await supabase.from("events").insert([
      {
        title,
        description: description || "",
        date,
        event_time,
        user_email: user_email || null, // optional
        sent: false                     // always start as not sent
      },
    ]);

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Event created successfully!", event: data[0] }),
    };
  } catch (err) {
    console.error("Error creating event:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
