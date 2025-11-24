// netlify/functions/events.js
const { createClient } = require("@supabase/supabase-js");

// Create Supabase client once
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// JSON response helper
function json(status, body) {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  const { httpMethod, rawPath } = event;

  // Normalize Netlify paths:
  //
  // rawPath might be:
  //   /.netlify/functions/events
  //   /.netlify/functions/events/123
  //   /api/events
  //   /api/events/123
  //
  let route = rawPath
    .replace(/^\/?\.netlify\/functions\/events/, "")
    .replace(/^\/?api\/events/, "")
    .replace(/^\/+/, ""); // remove leading slash

  // ------------------ CORS -------------------
  if (httpMethod === "OPTIONS") {
    return json(200, { ok: true });
  }

  // ------------------ GET /events -------------------
  if (httpMethod === "GET" && route === "") {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_time", { ascending: true });

    if (error) return json(500, { error: error.message });
    return json(200, data);
  }

  // Parse JSON body
  let body = {};
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      return json(400, { error: "Invalid JSON" });
    }
  }

  // ------------------ POST /events -------------------
  if (httpMethod === "POST" && route === "") {
    const { title, description, event_time, user_email } = body;

    if (!title || !event_time || !user_email) {
      return json(400, { error: "Missing required fields" });
    }

    const date = new Date(event_time).toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("events")
      .insert([{ title, description, event_time, user_email, date }])
      .select("*");

    if (error) return json(500, { error: error.message });
    return json(200, data);
  }

  // ---------------- Extract ID for PUT/DELETE -------------------
  const id = route.match(/^\d+$/) ? route : null;

  // ------------------ PUT /events/:id -------------------
  if (httpMethod === "PUT" && id) {
    const { title, description, event_time, user_email } = body;

    const date = new Date(event_time).toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("events")
      .update({ title, description, event_time, user_email, date })
      .eq("id", id)
      .select("*");

    if (error) return json(500, { error: error.message });
    return json(200, data);
  }

  // ------------------ DELETE /events/:id -------------------
  if (httpMethod === "DELETE" && id) {
    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) return json(500, { error: error.message });
    return json(200, { success: true });
  }

  // ------------------ Unknown Route -------------------
  return json(404, { error: `Route not found: ${httpMethod} /${route}` });
};
