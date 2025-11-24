const { supabase } = require('./_helpers');

exports.handler = async function(event) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { id } = body;
    if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'id required' }) };
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
    // also delete reminders_sent (cascade if FK set); just in case
    await supabase.from('reminders_sent').delete().eq('event_id', id);
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
