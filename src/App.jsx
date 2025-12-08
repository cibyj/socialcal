import React, { useEffect, useState } from "react";

// Automatically choose correct API base (local vs Netlify)
const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:3001/api"
    : "/.netlify/functions";

function fnUrl(path) {
  if (path.startsWith("/")) path = path.slice(1);
  return `${API_BASE}/${path}`;
}

function toLocalDateTimeInput(date) {
  const d = new Date(date);
  const pad = (n) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}


export default function App() {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [datetime, setDatetime] = useState("");
  const [email, setEmail] = useState("cibyj@hotmail.com"); // default email
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPast, setShowPast] = useState(false);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  async function load() {
    try {
      const r = await fetch(fnUrl("events"));
      if (!r.ok) throw new Error(`Error loading events: ${r.status}`);
      const resp = await r.json();
      setEvents(
        (Array.isArray(resp) ? resp : resp.data || []).map((e) => ({
          ...e,
          event_time: new Date(e.event_time),
        }))
      );
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function deletePastEvents() {
    if (!confirm("Delete all past events? This cannot be undone.")) return;

    try {
      const r = await fetch(fnUrl("events/past"), { method: "DELETE" });
      const data = await r.json();

      if (!r.ok) throw new Error(data.error || "Failed to delete past events");

      showSuccess("All past events deleted!");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function addOrUpdate() {
    if (!title || !datetime || !email)
      return setError("Title, date/time, and email are required");

    const evTime = new Date(datetime).toISOString();
    const payload = { title, description: desc, event_time: evTime, user_email: email };

    try {
      setError(null);
      const r = editId
        ? await fetch(fnUrl(`events/${editId}`), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(fnUrl("events"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!r.ok) {
        const data = await r.json();
        throw new Error(data.error || "Server error");
      }

      showSuccess(editId ? "Event updated!" : "Event added!");
      setEditId(null);
      setTitle("");
      setDesc("");
      setDatetime("");
      setEmail("cibyj@hotmail.com");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  function editEvent(ev) {
    setEditId(ev.id);
    setTitle(ev.title);
    setDesc(ev.description);
    setDatetime(toLocalDateTimeInput(ev.event_time));
    setEmail(ev.user_email || "cibyj@hotmail.com");
  }

  async function deleteEvent(id) {
    if (!confirm("Delete?")) return;
    try {
      const r = await fetch(fnUrl(`events/${id}`), { method: "DELETE" });
      if (!r.ok) throw new Error("Delete failed");
      showSuccess("Event deleted!");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const upcoming = events
    .filter((e) => e.event_time.getTime() > Date.now())
    .slice(0, 50);

  const pastEvents = events
    .filter((e) => e.event_time.getTime() <= Date.now())
    .sort((a, b) => b.event_time - a.event_time) // most recent past first
    .slice(0, 50);

  // Helper to format datetime without seconds
  const formatDateTime = (dt) =>
    new Date(dt).toLocaleString(undefined, {
      weekday: "long",   // ← added
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 960,
        margin: "0 auto",
        fontFamily: "Inter, system-ui, -apple-system, Roboto, Arial",
        backgroundColor: "#F9FAFB",
      }}
    >
      <h1 style={{ fontSize: 32, marginBottom: 16, color: "#4F46E5" }}>Social Calendar</h1>

      {error && (
        <div
          style={{
            backgroundColor: "#FEE2E2",
            color: "#B91C1C",
            padding: 12,
            borderRadius: 6,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            backgroundColor: "#D1FAE5",
            color: "#065F46",
            padding: 12,
            borderRadius: 6,
            marginBottom: 16,
          }}
        >
          {success}
        </div>
      )}

      {/* Add / Edit Event */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8, color: "#4F46E5" }}>
          {editId ? "Edit Event" : "Add Event"}
        </h2>

        <input
          style={{
            display: "block",
            width: "100%",
            padding: 10,
            marginBottom: 12,
            borderRadius: 6,
            border: "1px solid #D1D5DB",
            outline: "none",
          }}
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          style={{
            display: "block",
            width: "100%",
            padding: 10,
            marginBottom: 12,
            borderRadius: 6,
            border: "1px solid #D1D5DB",
            outline: "none",
          }}
          placeholder="Description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />

        <input
          type="datetime-local"
          style={{
            display: "block",
            padding: 10,
            marginBottom: 12,
            borderRadius: 6,
            border: "1px solid #D1D5DB",
            outline: "none",
          }}
          value={datetime}
          onChange={(e) => setDatetime(e.target.value)}
        />

        <input
          style={{
            display: "block",
            width: "100%",
            padding: 10,
            marginBottom: 12,
            borderRadius: 6,
            border: "1px solid #D1D5DB",
            outline: "none",
          }}
          placeholder="Notification Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div>
          <button
            onClick={addOrUpdate}
            style={{
              padding: "10px 16px",
              backgroundColor: "#4F46E5",
              color: "white",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
            }}
          >
            {editId ? "Update" : "Add"} Event
          </button>
          {editId && (
            <button
              onClick={() => {
                setEditId(null);
                setTitle("");
                setDesc("");
                setDatetime("");
                setEmail("cibyj@hotmail.com");
              }}
              style={{
                padding: "10px 16px",
                marginLeft: 12,
                backgroundColor: "#D1D5DB",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </section>

      {/* Upcoming Events */}
      <section>
        <h2 style={{ fontSize: 18, marginBottom: 8, color: "#4F46E5" }}>Upcoming Events</h2>

        {/* Toggle Show Past Events */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={showPast}
              onChange={() => setShowPast(!showPast)}
            />
            <span style={{ color: "#4F46E5", fontSize: 14 }}>Show Past Events</span>
          </label>
        </div>

        {/* Delete All Past Events */}
        <button
          onClick={deletePastEvents}
          style={{
            padding: "6px 10px",
            backgroundColor: "#EF4444",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            marginBottom: 16
          }}
        >
          Delete Past Events
        </button>

        {/* Past Events */}
        {showPast && (
          <section style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 18, marginBottom: 8, color: "#4F46E5" }}>Past Events</h2>

            {pastEvents.length === 0 && (
              <p style={{ marginTop: 8, color: "#6B7280" }}>No past events</p>
            )}

            <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 12 }}>
              {pastEvents.map((ev) => (
                <li
                  key={ev.id}
                  style={{
                    padding: 16,
                    backgroundColor: "#E5E7EB",
                    borderRadius: 8,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderLeft: "4px solid #EF4444",
                    opacity: 0.7,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{ev.title}</div>
                   
                   <div style={{ fontSize: 12 }}>
                     <span style={{ color: "green", fontWeight: 600 }}>
                        {formatDateTime(ev.event_time)}
                     </span>
                   </div>

                    <div style={{ marginTop: 6, fontSize: 14, color: "#374151" }}>{ev.description}</div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button
                      onClick={() => editEvent(ev)}
                      style={{
                        padding: "6px 10px",
                        backgroundColor: "#6366F1",
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer"
                      }}
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteEvent(ev.id)}
                      style={{
                        padding: "6px 10px",
                        backgroundColor: "#EF4444",
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer"
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Upcoming Events List */}
        {upcoming.length === 0 && (
          <p style={{ marginTop: 8, color: "#6B7280" }}>No upcoming events</p>
        )}

        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 12 }}>
          {upcoming.map((ev) => (
            <li
              key={ev.id}
              style={{
                padding: 16,
                backgroundColor: "white",
                borderRadius: 8,
                boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                display: "flex",
                justifyContent: "space-between",
                borderLeft: "4px solid #4F46E5",
                alignItems: "center"
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{ev.title}</div>
                
               <div style={{ fontSize: 12 }}>
                <span style={{ color: "green", fontWeight: 600 }}>
                 {formatDateTime(ev.event_time)}
                </span>
              </div>

                <div style={{ marginTop: 6, fontSize: 14, color: "#374151" }}>{ev.description}</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  onClick={() => editEvent(ev)}
                  style={{
                    padding: "6px 10px",
                    backgroundColor: "#6366F1",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer"
                  }}
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteEvent(ev.id)}
                  style={{
                    padding: "6px 10px",
                    backgroundColor: "#EF4444",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer"
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
