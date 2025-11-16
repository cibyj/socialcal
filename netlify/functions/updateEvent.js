const { supabase } = require('./_helpers');

exports.handler = async function(event) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { id, title, description, event_time } = body;
    if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'id required' }) };
    const { data, error } = await supabase.from('events').update({ title, description, event_time }).eq('id', id).select();
    if (error) throw error;
    return { statusCode: 200, body: JSON.stringify(data[0]) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
