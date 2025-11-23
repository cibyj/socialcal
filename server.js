require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/events
app.get("/api/events", async (req, res) => {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("event_time", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/events
app.post("/api/events", async (req, res) => {
  const { title, description, event_time, user_email } = req.body;
  if (!title || !event_time || !user_email)
    return res.status(400).json({ error: "Missing required fields" });

  const date = new Date(event_time).toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("events")
    .insert([{ title, description, event_time, user_email, date }])
    .select("*");

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PUT /api/events/:id  -> Edit event
app.put("/api/events/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, event_time, user_email } = req.body;

  const date = new Date(event_time).toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("events")
    .update({ title, description, event_time, user_email, date })
    .eq("id", id)
    .select("*");

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/events/:id  -> Delete event
app.delete("/api/events/:id", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("events")
    .delete()
    .eq("id", id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Optional: GET /api/getReminderEmail
// Optional: POST /api/setReminderEmail

app.listen(3001, () => console.log("API running at http://localhost:3001"));
