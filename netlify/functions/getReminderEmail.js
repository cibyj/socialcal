const { supabase } = require('./_helpers');

exports.handler = async function() {
  try {
    const { data, error } = await supabase.from('settings').select('reminder_email').eq('id',1).single();
    if (error && error.code !== 'PGRST116') { /* ignore not found */ }
    return { statusCode: 200, body: JSON.stringify({ reminder_email: data ? data.reminder_email : null }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
