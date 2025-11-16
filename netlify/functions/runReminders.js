const { supabase, sendMail } = require('./_helpers');

exports.handler = async function() {
  try {
    const { data: settings } = await supabase.from('settings').select('reminder_email').eq('id',1).limit(1).single();
    if (!settings || !settings.reminder_email) return { statusCode: 200, body: JSON.stringify({ sent: 0, reason: 'no email configured' }) };
    const email = settings.reminder_email;

    const { data: events } = await supabase.from('events').select('*');
    const offsets = [7,2,1];
    const now = Date.now();
    let sentCount = 0;

    for (const ev of events) {
      const evTime = Number(ev.event_time);
      for (const off of offsets) {
        const offsetMs = off * 24 * 60 * 60 * 1000;
        const target = evTime - offsetMs;
        const windowStart = target - 15*60*1000;
        const windowEnd = target + 15*60*1000;
        const { data: already } = await supabase.from('reminders_sent').select('id').eq('event_id', ev.id).eq('offset_days', off).limit(1);
        if (now >= windowStart && now < windowEnd && (!already || already.length === 0)) {
          const subject = `Reminder: ${ev.title} in ${off} day${off>1?'s':''}`;
          const text = `Reminder: ${ev.title}\nWhen: ${new Date(evTime).toLocaleString()}\n\nDescription:\n${ev.description||''}`;
          await sendMail(email, subject, text, `<pre>${text}</pre>`);
          await supabase.from('reminders_sent').insert([{ event_id: ev.id, offset_days: off, sent_at: now }]);
          sentCount++;
        }
      }
    }

    return { statusCode: 200, body: JSON.stringify({ sent: sentCount }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
