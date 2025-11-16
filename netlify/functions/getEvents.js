const { supabase } = require('./_helpers');

exports.handler = async function(event) {
  try {
    const { data, error } = await supabase.from('events').select('*').order('event_time', { ascending: true });
    if (error) throw error;
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
