const { supabase } = require('./_helpers');

exports.handler = async function(event) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { title, description, event_time } = body;
    if (!title || !event_time) return { statusCode: 400, body: JSON.stringify({ error: 'title and event_time required' }) };
    const { data, error } = await supabase.from('events').insert([{ title, description: description||'', event_time }]).select();
    if (error) throw error;
    return { statusCode: 200, body: JSON.stringify(data[0]) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
