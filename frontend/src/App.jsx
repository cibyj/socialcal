import React, { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_BASE || '/.netlify/functions';

function fnUrl(path) {
  if (path.startsWith('/')) path = path.slice(1);
  return `${API}/${path}`;
}

export default function App() {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [datetime, setDatetime] = useState('');
  const [email, setEmail] = useState('');
  const [editId, setEditId] = useState(null);

  async function load() {
    try {
      const r = await fetch(fnUrl('getEvents'));
      const resp = await r.json();

// If your function wraps data in { data: [...], error: ... }
 if (Array.isArray(resp)) {
  setEvents(resp);
} else if (resp.data) {
  setEvents(resp.data);
} else {
  setEvents([]);
}

      const re = await fetch(fnUrl('getReminderEmail'));
      const je = await re.json();
      setEmail(je.reminder_email || '');
    } catch (err) {
      console.error("Error loading data:", err);
    }
  }

  useEffect(() => { load(); }, []);

  async function saveEmail() {
    try {
      await fetch(fnUrl('setReminderEmail'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reminder_email: email })
      });
      alert('Saved');
    } catch (err) {
      console.error("Error saving email:", err);
    }
  }

  async function addOrUpdate() {
    if (!title) return alert('Title required');
    let evTime = null;
    if (datetime) {
      const t = new Date(datetime).getTime();
      if (!isNaN(t)) evTime = t;
    }
    if (!evTime) return alert('Valid date/time required');

    try {
      if (editId) {
        await fetch(fnUrl('updateEvent'), {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id: editId, title, description: desc, event_time: evTime })
        });
        setEditId(null);
      } else {
        await fetch(fnUrl('createEvent'), {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ title, description: desc, event_time: evTime, user_email: email })
        });
      }
      setTitle(''); setDesc(''); setDatetime('');
      load();
    } catch (err) {
      console.error("Error adding/updating event:", err);
      alert('Failed to add/update event. Check console.');
    }
  }

  function editEvent(ev) {
    setEditId(ev.id);
    setTitle(ev.title || '');
    setDesc(ev.description || '');
    if (ev.event_time) {
      const iso = new Date(ev.event_time).toISOString().slice(0,16);
      setDatetime(iso);
    } else setDatetime('');
  }

  async function deleteEvent(id) {
    if (!confirm('Delete?')) return;
    try {
      await fetch(fnUrl('deleteEvent'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id })
      });
      load();
    } catch (err) {
      console.error("Error deleting event:", err);
      alert('Failed to delete event. Check console.');
    }
  }

  const upcoming = events
  .filter(e => new Date(e.event_time).getTime() > Date.now())
  .slice(0, 50);

  return (
    <div style={{padding:20, maxWidth:900, margin:'0 auto', fontFamily:'Inter, system-ui, -apple-system, Roboto, Arial'}}>
      <h1 style={{fontSize:28, marginBottom:12}}>Social Calendar</h1>

      <section style={{marginBottom:20}}>
        <h2 style={{fontSize:16}}>Notification Email</h2>
        <div style={{display:'flex', gap:8, marginTop:8}}>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{flex:1, padding:8}}
          />
          <button onClick={saveEmail} style={{padding:'8px 12px'}}>Save</button>
        </div>
      </section>

      <section style={{marginBottom:20}}>
        <h2 style={{fontSize:16}}>Add / Edit Event</h2>
        <input
          style={{display:'block', width:'100%', padding:8, marginTop:8}}
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <textarea
          style={{display:'block', width:'100%', padding:8, marginTop:8}}
          placeholder="Description"
          value={desc}
          onChange={e => setDesc(e.target.value)}
        />
        <input
          style={{display:'block', marginTop:8, padding:8}}
          type="datetime-local"
          value={datetime}
          onChange={e => setDatetime(e.target.value)}
        />
        <div style={{marginTop:8}}>
          <button onClick={addOrUpdate} style={{padding:'8px 12px'}}>
            {editId ? 'Update' : 'Add'} Event
          </button>
          {editId && (
            <button
              onClick={() => { setEditId(null); setTitle(''); setDesc(''); setDatetime(''); }}
              style={{marginLeft:8}}
            >
              Cancel
            </button>
          )}
        </div>
      </section>

      <section>
        <h2 style={{fontSize:16}}>Upcoming Events</h2>
        {upcoming.length === 0 && <p style={{marginTop:8}}>No upcoming events</p>}
        <ul style={{marginTop:8, listStyle:'none', padding:0, display:'grid', gap:8}}>
          {upcoming.map(ev => (
            <li key={ev.id} style={{padding:12, border:'1px solid #e5e7eb', borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <div style={{fontWeight:600}}>{ev.title}</div>
                <div style={{fontSize:12, color:'#374151'}}>{ev.event_time ? new Date(ev.event_time).toLocaleString() : 'No date'}</div>
                <div style={{fontSize:13, marginTop:6}}>{ev.description}</div>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:8}}>
                <button onClick={() => editEvent(ev)} style={{padding:'6px 10px'}}>Edit</button>
                <button onClick={() => deleteEvent(ev.id)} style={{padding:'6px 10px'}}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
