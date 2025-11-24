const { supabase } = require('./_helpers');

exports.handler = async function(event) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { reminder_email } = body;
    if (!reminder_email) return { statusCode: 400, body: JSON.stringify({ error: 'reminder_email required' }) };
    const { error } = await supabase.from('settings').upsert({ id:1, reminder_email });
    if (error) throw error;
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
