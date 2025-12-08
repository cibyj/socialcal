// netlify/functions/events.js
const { getSupabase } = require("./_helpers");

// Create Supabase client (via helper which checks env vars)
const supabase = getSupabase();

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
  // Defensive: ensure supabase is available
  if (!supabase) {
    console.error("Supabase client not initialized. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    return json(500, { error: "Server misconfiguration: missing Supabase credentials" });
  }

  const { httpMethod } = event;

  // Normalize path from various invocation shapes (safe fallback to empty string)
  const rawPath =
    event.rawPath ||
    event.path ||
    (event.requestContext && event.requestContext.http && event.requestContext.http.path) ||
    "";

  // Normalize Netlify paths to get route portion
  let route = String(rawPath)
    .replace(/^\/?\.netlify\/functions\/events/, "")
    .replace(/^\/?api\/events/, "")
    .replace(/^\/+/, ""); // remove leading slash

  // ------------------ CORS -------------------
  if (httpMethod === "OPTIONS") {
    return json(200, { ok: true });
  }

  // ------------------ GET /events -------------------
  if (httpMethod === "GET" && route === "") {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_time", { ascending: true });

      if (error) {
        console.error("Supabase error (GET /events):", error);
        return json(500, { error: error.message });
      }
      return json(200, data);
    } catch (err) {
      console.error("Unhandled error (GET /events):", err);
      return json(500, { error: "Internal server error" });
    }
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

    if (error) {
      console.error("Supabase error (POST /events):", error);
      return json(500, { error: error.message });
    }
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

    if (error) {
      console.error(`Supabase error (PUT /events/${id}):`, error);
      return json(500, { error: error.message });
    }
    return json(200, data);
  }

  // ------------------ DELETE /events/:id -------------------
  if (httpMethod === "DELETE" && id) {
    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) {
      console.error(`Supabase error (DELETE /events/${id}):`, error);
      return json(500, { error: error.message });
    }
    return json(200, { success: true });
  }

  // ------------------ Unknown Route -------------------
  return json(404, { error: `Route not found: ${httpMethod} /${route}` });
};
